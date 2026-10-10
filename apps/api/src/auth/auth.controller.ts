import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./login.dto";
import { RecoveryCompleteDto, RecoveryStartDto } from "./recovery.dto";
import { AuthenticatedRequest, SessionGuard } from "./session.guard";
import { durationMs } from "./token-ttl";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: (process.env.COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",
      path: "/" as const,
    };
  }

  @Post("login")
  @ApiOperation({ summary: "Log in with phone and password" })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto.phone, dto.password);
    response.cookie("olapay_access", result.accessToken, {
      ...this.cookieOptions(),
      maxAge: durationMs(process.env.ACCESS_TOKEN_TTL, "15m"),
    });
    response.cookie("olapay_refresh", result.refreshToken, {
      ...this.cookieOptions(),
      maxAge: durationMs(process.env.REFRESH_TOKEN_TTL, "7d"),
    });
    return { user: result.user };
  }

  @Post("recovery/start")
  async startRecovery(@Body() dto: RecoveryStartDto) {
    return this.auth.startRecovery(dto.phone);
  }

  @Post("recovery/complete")
  async completeRecovery(@Body() dto: RecoveryCompleteDto) {
    return this.auth.completeRecovery(dto.phone, dto.code, dto.password);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Rotate the refresh session" })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.refresh(request.cookies?.olapay_refresh ?? "");
    response.cookie("olapay_access", result.accessToken, {
      ...this.cookieOptions(),
      maxAge: durationMs(process.env.ACCESS_TOKEN_TTL, "15m"),
    });
    response.cookie("olapay_refresh", result.refreshToken, {
      ...this.cookieOptions(),
      maxAge: durationMs(process.env.REFRESH_TOKEN_TTL, "7d"),
    });
    return { user: result.user };
  }

  @Post("logout")
  @ApiOperation({ summary: "Revoke the refresh session and clear cookies" })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.olapay_refresh);
    response.clearCookie("olapay_access", this.cookieOptions());
    response.clearCookie("olapay_refresh", this.cookieOptions());
    return { ok: true };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  async me(@Req() request: AuthenticatedRequest) {
    return { user: await this.auth.currentUser(request.user!.sub) };
  }
}
