import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "../database/prisma.service";

export type AuthenticatedRequest = Request & { user?: { sub: string; role: string } };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      request.cookies?.olapay_access ?? request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new UnauthorizedException("Authentication required");
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: string; sid: string }>(token);
      const session = await this.prisma.refreshSession.findFirst({
        where: { id: payload.sid, userId: payload.sub },
        select: {
          revokedAt: true,
          expiresAt: true,
          user: { select: { status: true, role: true } },
        },
      });
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        session.user.status !== "ACTIVE"
      )
        throw new UnauthorizedException("Session expired");
      request.user = { sub: payload.sub, role: session.user.role };
      return true;
    } catch {
      throw new UnauthorizedException("Session expired");
    }
  }
}
