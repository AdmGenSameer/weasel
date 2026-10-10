import "reflect-metadata";
import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET must be configured in production");
  }
  const app = await NestFactory.create(AppModule);
  if (process.env.RENDER === "true") {
    // Trust Render's single reverse proxy, without trusting arbitrary forwarded headers.
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  app.enableCors({ origin: webOrigin, credentials: true });
  app.use(
    "/api/v1",
    rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }),
  );
  app.use(
    "/api/v1/auth/login",
    rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false }),
  );
  app.use(
    "/api/v1/auth/recovery",
    rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false }),
  );
  app.use(
    "/api/v1/profile/pin",
    rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    const method = request.method.toUpperCase();
    const origin = request.headers.origin;
    const hasSessionCookie = Boolean(
      request.headers.cookie?.includes("olapay_access") ||
      request.headers.cookie?.includes("olapay_refresh"),
    );
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      ((origin && origin !== webOrigin) || (hasSessionCookie && !origin))
    ) {
      response.status(403).json({ statusCode: 403, message: "Request origin is not allowed" });
      return;
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const config = new DocumentBuilder()
    .setTitle("OlaPay Local API")
    .setDescription("Local mock API for the OlaPay recreation")
    .setVersion("1.0")
    .addCookieAuth("olapay_access")
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
