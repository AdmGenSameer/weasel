import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { PrismaService } from "../database/prisma.service";

type MockPaymentJob = { id: string; entity: "deposit" | "payment" };

@Processor("mock-payments")
export class MockPaymentsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<MockPaymentJob>) {
    const status =
      job.data.entity === "deposit"
        ? (
            await this.prisma.depositOrder.findUnique({
              where: { id: job.data.id },
              select: { status: true },
            })
          )?.status
        : (
            await this.prisma.paymentIntent.findUnique({
              where: { id: job.data.id },
              select: { status: true },
            })
          )?.status;
    if (status !== "INITIATED" && status !== "PROCESSING") return;

    if (status === "INITIATED") {
      if (job.data.entity === "deposit")
        await this.prisma.depositOrder.update({
          where: { id: job.data.id },
          data: { status: "PROCESSING" },
        });
      else
        await this.prisma.paymentIntent.update({
          where: { id: job.data.id },
          data: { status: "PROCESSING" },
        });
    }
    const delayMs = Math.min(
      Math.max(Number(process.env.MOCK_PAYMENT_DELAY_MS ?? 1200), 0),
      30_000,
    );
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    // A mock can only reach the pending state: without a signed provider callback, it must not settle funds.
    if (job.data.entity === "deposit")
      await this.prisma.depositOrder.updateMany({
        where: { id: job.data.id, status: "PROCESSING" },
        data: { status: "PENDING" },
      });
    else
      await this.prisma.paymentIntent.updateMany({
        where: { id: job.data.id, status: "PROCESSING" },
        data: { status: "PENDING" },
      });
  }
}
