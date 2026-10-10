# OlaPay Local Recreation

A local, development-only recreation of the OlaPay account interface based on pages visible in an authorized reference session. It includes a separate Next.js web app, NestJS REST API, PostgreSQL data model, Redis service, and mock payment/account workflows.

**Mock mode is always visible.** The mock provider does not connect to a real payment network, create a production UPI link, or transfer money. Never enter production credentials into this application.

## Features

- Phone/password login with Argon2 password verification, short-lived access cookie, refresh-session rotation, logout, and protected API routes.
- Local mock-SMS password recovery, session revocation, account profile, and password-verified six-digit PIN setup/reset.
- Home summary; USDT and INR deposit views; bonus calculator and sortable mock offers.
- UPI account list and mock pending-verification state.
- BullMQ-backed mock action processing with idempotent jobs; local transactions remain pending until a provider callback is configured.
- Team aggregates and referral view using fictional development data.
- Profile/account screen, help manual, recharge history, and typed token history.
- Loading, validation, empty, and recoverable error states; responsive phone-width layout with bottom navigation.
- PostgreSQL schema/seed, Docker Compose for PostgreSQL and Redis, API Swagger docs, and CI workflows.

Some production-only actions—SMS verification, payment settlement, UPI provider linking, authenticator setup and real transfer execution—are represented by local mock states. Local password recovery uses an expiring development OTP and revokes existing sessions. The visible production flows not safely inspectable are documented in [`docs/FEATURE-INVENTORY.md`](docs/FEATURE-INVENTORY.md).

## Technology

- Web: Next.js App Router, React, TypeScript, CSS design tokens, Lucide icons, Zod.
- API: NestJS, TypeScript, class-validator, Swagger/OpenAPI.
- Data: PostgreSQL and Prisma.
- Infrastructure: Docker Compose, Redis, and BullMQ for asynchronous mock-provider processing.
- Security: Argon2 password hashes, short-lived JWT access cookies, opaque hashed refresh sessions, cookie flags, Helmet, validation, and server-side ownership checks.

## Requirements

- Node.js 20.9 or newer and npm 10 or newer.
- Docker Desktop / Docker Engine with Compose for PostgreSQL and Redis, or equivalent PostgreSQL 16 and Redis 7 services.
- Modern Chrome, Edge, Firefox, or Safari.

## Install

```powershell
Copy-Item .env.example .env
npm ci
docker compose up -d
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open the web app at <http://localhost:3000>. The API is at <http://localhost:4000/api/v1>; Swagger is at <http://localhost:4000/api/docs>.

The development seed creates a fictional local account from `DEMO_USER_PHONE` and `DEMO_USER_PASSWORD` in `.env`. Defaults are `9000000001` and `DemoPass!234`. Change both for any shared environment. The seed refuses to run when `NODE_ENV=production`.

## Environment

See [`.env.example`](.env.example) for local defaults and [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for each variable. Generate unique JWT secrets before exposing the app to a network. Do not use the example values in production.

## Database

```powershell
npm run db:generate
npm run db:migrate -- --name add_feature
npm run db:seed
```

The seed contains fictional data and resets demo UPI and ledger rows for the seeded user. Use only in a disposable development database.

## Run and build

```powershell
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Web and API run concurrently. To run either separately, use `npm run web:dev` or `npm run api:dev`.

## Docker

`docker compose up -d` starts PostgreSQL and Redis. Stop them with `docker compose down`; add `-v` only when you intend to permanently remove the local database and Redis volumes.

## API and architecture

- [API reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Developer guide](docs/DEVELOPMENT.md)
- [Feature inventory](docs/FEATURE-INVENTORY.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)

## Testing

Unit tests run with `npm test` (Node's built-in test runner after compiling the API). Browser E2E requires the API, PostgreSQL, seed data, and a Playwright browser installation.

## Production status

This repository is an in-progress recreation. It is not ready for production financial use. Before deployment, replace local mock workflows with reviewed provider integrations, configure production-grade secrets and cookie/TLS settings, implement security/risk controls, complete the uninspected account workflows, and perform independent security and compliance review.
