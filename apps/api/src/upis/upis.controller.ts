import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/session.guard";
import { SessionGuard } from "../auth/session.guard";
import { PrismaService } from "../database/prisma.service";
import { CreateUpiDto, UpdateUpiDto } from "./upi.dto";

@ApiTags("upis")
@Controller("upis")
@UseGuards(SessionGuard)
export class UpisController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    const accounts = await this.prisma.upiAccount.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
    });
    return {
      accounts: accounts.map(({ id, address, status, sellEnabled }) => ({
        id,
        address,
        status,
        sellEnabled,
      })),
    };
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateUpiDto) {
    const account = await this.prisma.upiAccount.create({
      data: {
        userId: req.user!.sub,
        address: dto.address,
        status: "PENDING_VERIFICATION",
        sellEnabled: false,
      },
      select: { id: true, status: true, sellEnabled: true },
    });
    return {
      account,
      mockMode: true,
      message: "Verification is simulated. This account is not connected to a payment network.",
    };
  }

  @Patch(":id/sell")
  async setSellState(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateUpiDto,
  ) {
    const result = await this.prisma.upiAccount.updateMany({
      where: { id, userId: req.user!.sub, status: "AVAILABLE" },
      data: { sellEnabled: dto.sellEnabled },
    });
    if (result.count !== 1) throw new NotFoundException("Available account not found");
    return { ok: true };
  }

  @Patch(":id/link")
  async requestVerification(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const result = await this.prisma.upiAccount.updateMany({
      where: { id, userId: req.user!.sub, status: "UNAVAILABLE" },
      data: { status: "PENDING_VERIFICATION", sellEnabled: false },
    });
    if (result.count !== 1) throw new NotFoundException("Account not found or already pending");
    return { ok: true, status: "PENDING_VERIFICATION", mockMode: true };
  }
}
