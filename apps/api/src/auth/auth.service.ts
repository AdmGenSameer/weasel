import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { durationMs } from "./token-ttl";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private readonly recoveryCodes = new Map<
    string,
    { hash: Buffer; expiresAt: number; attempts: number }
  >();

  async login(phone: string, password: string) {
    const normalized = phone.replace(/[\s-]/g, "");
    const user = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (!user || user.status !== "ACTIVE" || !(await argon2.verify(user.passwordHash, password)))
      throw new UnauthorizedException("Phone number or password is incorrect");
    const sessionId = randomUUID();
    const secret = randomBytes(32).toString("base64url");
    const refreshToken = `${sessionId}.${secret}`;
    const expiresAt = new Date(Date.now() + durationMs(process.env.REFRESH_TOKEN_TTL, "7d"));
    await this.prisma.refreshSession.create({
      data: { id: sessionId, userId: user.id, tokenHash: await argon2.hash(secret), expiresAt },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role, sid: sessionId });
    return { user: { id: user.id, phone: user.phone, role: user.role }, accessToken, refreshToken };
  }

  async refresh(value: string) {
    const [id, secret] = value.split(".");
    if (!id || !secret) throw new UnauthorizedException("Invalid session");
    const session = await this.prisma.refreshSession.findUnique({
      where: { id },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== "ACTIVE" ||
      !(await argon2.verify(session.tokenHash, secret))
    )
      throw new UnauthorizedException("Session expired");
    const nextSecret = randomBytes(32).toString("base64url");
    const nextToken = `${id}.${nextSecret}`;
    await this.prisma.refreshSession.update({
      where: { id },
      data: {
        tokenHash: await argon2.hash(nextSecret),
        expiresAt: new Date(Date.now() + durationMs(process.env.REFRESH_TOKEN_TTL, "7d")),
      },
    });
    return {
      user: { id: session.user.id, phone: session.user.phone, role: session.user.role },
      accessToken: await this.jwt.signAsync({
        sub: session.user.id,
        role: session.user.role,
        sid: id,
      }),
      refreshToken: nextToken,
    };
  }

  async logout(value?: string) {
    const id = value?.split(".")[0];
    if (id)
      await this.prisma.refreshSession.updateMany({
        where: { id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }

  async currentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, role: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException("Account unavailable");
    return user;
  }

  async startRecovery(phone: string) {
    const normalized = phone.replace(/[\s-]/g, "");
    this.recoveryCodes.delete(normalized);
    const user = await this.prisma.user.findUnique({
      where: { phone: normalized },
      select: { id: true },
    });
    if (!user)
      return { ok: true, message: "If the account exists, a recovery code has been sent." };
    if (process.env.NODE_ENV === "production" || process.env.SMS_MODE !== "mock")
      return { ok: true, message: "If the account exists, a recovery code has been sent." };
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    this.recoveryCodes.set(normalized, {
      hash: createHash("sha256").update(code).digest(),
      expiresAt: Date.now() + 5 * 60_000,
      attempts: 0,
    });
    return {
      ok: true,
      message: "If the account exists, a recovery code has been sent.",
      mockCode: code,
    };
  }

  async completeRecovery(phone: string, code: string, password: string) {
    const normalized = phone.replace(/[\s-]/g, "");
    const record = this.recoveryCodes.get(normalized);
    if (!record || Date.now() >= record.expiresAt || record.attempts >= 5) {
      this.recoveryCodes.delete(normalized);
      throw new UnauthorizedException("Recovery code is invalid or expired");
    }
    const submitted = createHash("sha256").update(code).digest();
    if (!timingSafeEqual(record.hash, submitted)) {
      record.attempts += 1;
      throw new UnauthorizedException("Recovery code is invalid or expired");
    }
    const user = await this.prisma.user.findUnique({
      where: { phone: normalized },
      select: { id: true },
    });
    if (!user) throw new UnauthorizedException("Recovery code is invalid or expired");
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await argon2.hash(password) },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    this.recoveryCodes.delete(normalized);
    return { ok: true };
  }
}
