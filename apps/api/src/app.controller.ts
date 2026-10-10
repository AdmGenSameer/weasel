import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "./auth/session.guard";
import { SessionGuard } from "./auth/session.guard";
import { PrismaService } from "./database/prisma.service";

@ApiTags("app")
@Controller()
@UseGuards(SessionGuard)
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("dashboard")
  async dashboard(@Req() req: AuthenticatedRequest) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: req.user!.sub } });
    return {
      quotaInr: wallet?.quotaInr ?? "0.00",
      rewardRatio: wallet?.rewardRatio ?? "0",
      usdtRateInr: "110.50",
      todayReceived: "0.00",
      inTransaction: "0.00",
      mockMode: true,
    };
  }

  @Get("upis")
  async upis(@Req() req: AuthenticatedRequest) {
    const rows = await this.prisma.upiAccount.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
    });
    return {
      accounts: rows.map(({ id, address, status, sellEnabled }) => ({
        id,
        address,
        status,
        sellEnabled,
      })),
    };
  }

  @Get("team")
  async team(@Req() req: AuthenticatedRequest) {
    const rows = await this.prisma.teamMember.findMany({
      where: { ownerId: req.user!.sub },
      include: { member: { select: { id: true } } },
      orderBy: { joinedAt: "desc" },
      take: 50,
    });
    return {
      memberCount: rows.length,
      rechargeTotal: rows.reduce((n, row) => n + Number(row.rechargeTotal), 0),
      commissionTotal: rows.reduce((n, row) => n + Number(row.commissionTotal), 0),
      members: rows.map((row) => ({
        id: row.member.id.slice(0, 8),
        rechargeTotal: row.rechargeTotal,
        commissionTotal: row.commissionTotal,
      })),
    };
  }

  @Get("history/recharges")
  async recharges(@Req() req: AuthenticatedRequest) {
    return this.prisma.depositOrder.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  @Get("history/tokens")
  async tokens(@Req() req: AuthenticatedRequest) {
    return this.prisma.ledgerEntry.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
