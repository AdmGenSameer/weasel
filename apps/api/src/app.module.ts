import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "./database/prisma.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { SessionGuard } from "./auth/session.guard";
import { AppController } from "./app.controller";
import { DepositsController } from "./deposits/deposits.controller";
import { UpisController } from "./upis/upis.controller";
import { PaymentsController } from "./payments/payments.controller";
import { durationMs } from "./auth/token-ttl";
import { MockPaymentsProcessor } from "./jobs/mock-payments.processor";
import { ProfileController } from "./profile/profile.controller";
import { ProfileService } from "./profile/profile.service";

const redis = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? "local-only-change-me",
      signOptions: {
        expiresIn: Math.floor(durationMs(process.env.ACCESS_TOKEN_TTL, "15m") / 1000),
      },
    }),
    BullModule.forRoot({
      connection: {
        host: redis.hostname,
        port: Number(redis.port || 6379),
        ...(redis.username ? { username: decodeURIComponent(redis.username) } : {}),
        ...(redis.password ? { password: decodeURIComponent(redis.password) } : {}),
        ...(redis.protocol === "rediss:" ? { tls: {} } : {}),
      },
    }),
    BullModule.registerQueue({ name: "mock-payments" }),
  ],
  controllers: [
    AuthController,
    AppController,
    DepositsController,
    UpisController,
    PaymentsController,
    ProfileController,
  ],
  providers: [PrismaService, AuthService, SessionGuard, MockPaymentsProcessor, ProfileService],
})
export class AppModule {}
