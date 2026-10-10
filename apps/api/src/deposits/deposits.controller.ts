import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { Prisma } from "../generated/prisma/client";
import type { AuthenticatedRequest } from "../auth/session.guard";
import { SessionGuard } from "../auth/session.guard";
import { PrismaService } from "../database/prisma.service";
import { CreateDepositDto } from "./deposit.dto";
import { validateDepositAmount } from "./deposit-rules";

@ApiTags("deposits")
@Controller("deposits")
@UseGuards(SessionGuard)
export class DepositsController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("mock-payments") private readonly queue: Queue,
  ) {}

  @Get("offers")
  offers() {
    return {
      usdtRateInr: 110.5,
      bonusRatio: 0.01,
      payment: [465, 485, 487].map((amount) => ({ amount, income: amount * 0.03, percent: 3 })),
      vip: [24000, 42000].map((amount, index) => ({
        amount,
        income: amount * (index === 0 ? 0.04 : 0.05),
        percent: index === 0 ? 4 : 5,
      })),
    };
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDepositDto,
    @Headers("idempotency-key") key?: string,
  ) {
    if (dto.currency === "USDT" && !dto.network)
      throw new BadRequestException("A network is required for USDT deposits");
    if (!validateDepositAmount(dto.currency, dto.amount, dto.offerKind))
      throw new BadRequestException(
        dto.currency === "INR"
          ? "Choose an active INR offer and its listed amount"
          : "USDT deposits must be between 1 and 10,000 USDT",
      );
    const idempotencyKey = key?.trim() || randomUUID();
    const existing = await this.prisma.depositOrder.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.userId !== req.user!.sub)
        throw new BadRequestException("Idempotency key already used");
      if (existing.status === "INITIATED")
        await this.queue.add(
          "process",
          { entity: "deposit", id: existing.id },
          { jobId: `deposit-${existing.id}`, delay: 100, removeOnComplete: 100, removeOnFail: 100 },
        );
      return { order: existing, mockMode: true };
    }
    const rate = new Prisma.Decimal(dto.currency === "USDT" ? "110.5" : "1");
    const amount = new Prisma.Decimal(String(dto.amount));
    const base = dto.currency === "USDT" ? amount.mul(rate) : amount;
    const bonus = dto.currency === "USDT" ? base.mul("0.01") : new Prisma.Decimal(0);
    const order = await this.prisma.depositOrder.create({
      data: {
        userId: req.user!.sub,
        currency: dto.currency,
        network: dto.network,
        amount,
        quotedRate: rate,
        bonusAmount: bonus,
        quotaAmount: base.add(bonus),
        idempotencyKey,
      },
    });
    await this.queue.add(
      "process",
      { entity: "deposit", id: order.id },
      { jobId: `deposit-${order.id}`, delay: 100, removeOnComplete: 100, removeOnFail: 100 },
    );
    return { order, mockMode: true, message: "Initiated locally; no funds were transferred." };
  }
}
