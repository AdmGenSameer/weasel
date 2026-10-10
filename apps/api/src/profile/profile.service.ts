import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, role: true, pinHash: true },
    });
    if (!user) throw new UnauthorizedException("Account unavailable");
    return { id: user.id, phone: user.phone, role: user.role, hasPin: Boolean(user.pinHash) };
  }

  async setPin(userId: string, currentPassword: string, pin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, status: true },
    });
    if (
      !user ||
      user.status !== "ACTIVE" ||
      !(await argon2.verify(user.passwordHash, currentPassword))
    ) {
      throw new UnauthorizedException("Current password is incorrect");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash: await argon2.hash(pin) },
    });
    return { ok: true, hasPin: true };
  }
}
