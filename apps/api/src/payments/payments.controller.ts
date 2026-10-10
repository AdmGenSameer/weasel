import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import type { AuthenticatedRequest } from "../auth/session.guard";
import { SessionGuard } from "../auth/session.guard";
import { PrismaService } from "../database/prisma.service";
import { CreatePaymentIntentDto } from "./payment.dto";

@ApiTags("payments")
@Controller("payments")
@UseGuards(SessionGuard)
export class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("mock-payments") private readonly queue: Queue,
  ) {}

  @Post("mock")
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentIntentDto,
    @Headers("idempotency-key") key?: string,
  ) {
    if (dto.kind === "SEND" && !dto.recipient?.trim())
      throw new BadRequestException("A recipient is required");
    const idempotencyKey = key?.trim() || randomUUID();
    const existing = await this.prisma.paymentIntent.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.userId !== req.user!.sub)
        throw new BadRequestException("Idempotency key already used");
      if (existing.status === "INITIATED")
        await this.queue.add(
          "process",
          { entity: "payment", id: existing.id },
          { jobId: `payment-${existing.id}`, delay: 100, removeOnComplete: 100, removeOnFail: 100 },
        );
      return { intent: existing, mockMode: true };
    }
    const intent = await this.prisma.paymentIntent.create({
      data: {
        userId: req.user!.sub,
        kind: dto.kind,
        amount: dto.amount,
        recipient: dto.recipient?.trim(),
        idempotencyKey,
      },
    });
    await this.queue.add(
      "process",
      { entity: "payment", id: intent.id },
      { jobId: `payment-${intent.id}`, delay: 100, removeOnComplete: 100, removeOnFail: 100 },
    );
    return { intent, mockMode: true, message: "Recorded locally; no funds were transferred." };
  }

  @Get("mock")
  async list(@Req() req: AuthenticatedRequest) {
    return this.prisma.paymentIntent.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
