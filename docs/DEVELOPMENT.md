# Development Guide

## Architecture

`apps/web` is a Next.js App Router client experience. It owns route rendering, accessible interactions, validation feedback, and the persistent phone-width layout. `apps/api` is a separate NestJS REST API. DTOs validate incoming requests; authentication/profile operations use domain services, while simpler account-scoped CRUD controllers currently issue Prisma queries directly. PostgreSQL is the source of truth for users, sessions, wallets, deposits, UPI records, ledger entries, and team aggregates. Redis persists BullMQ mock-provider jobs so asynchronous status changes survive API restarts.

Profile PIN setup is protected by the session guard, per-route rate limits, and a current-password check; PINs are stored only as Argon2 hashes. Local recovery codes are short-lived and in-memory, so a production SMS adapter must use shared, durable token storage.

## Folder structure

```text
apps/web/app/                 Next.js route entry points and global styles
apps/web/components/          App shell and reusable view components
apps/web/lib/                 Frontend validation and API helpers
apps/api/src/auth/            Login, refresh, logout, and session guard
apps/api/src/database/        Prisma client service
apps/api/src/deposits/        Deposit DTO and mock deposit endpoint
apps/api/src/upis/            UPI DTOs and account endpoints
apps/api/prisma/              PostgreSQL schema and fictional seed
docs/                         User and developer documentation
```

## Authentication flow

The web app submits phone/password to `POST /api/v1/auth/login`. NestJS normalizes the phone, verifies an Argon2 hash, creates a refresh-session row containing only a hash of a random secret, and sets HTTP-only cookies for access and refresh tokens. Access tokens are short-lived. `POST /auth/refresh` rotates the stored refresh secret. `POST /auth/logout` revokes the session and clears cookies. Protected controllers use `SessionGuard`; frontend route checks are only a convenience and do not grant API access.

## Payment flow

`DepositOrder` starts in `INITIATED`; frontend input never marks an order successful. The API recalculates rate, bonus, and quota amount. A production provider must verify settlement via signed webhooks before updating state or crediting quota. The current provider is local mock mode; it does not send funds. Financial ledger and wallet changes must happen in a database transaction, be idempotent, and be authorized server-side.

## State management

Page-local controls use React state. Authentication state is verified with the API's `/auth/me` endpoint and backed by HTTP-only cookies. Do not place passwords, refresh tokens, payment details, or user identifiers in local storage. If shared client state grows, add a small Zustand store for non-sensitive view state only.

## Add a feature

1. Add or update the feature row in `docs/FEATURE-INVENTORY.md`.
2. Define request/response types and validation before UI wiring.
3. Add Prisma models only when persisted domain state is required; create a migration and safe seed data.
4. Add a Nest controller and service with ownership checks and consistent status codes.
5. Add frontend loading, empty, error, success, and mobile states.
6. Add unit/integration/E2E coverage and update `docs/API.md` and `docs/ARCHITECTURE.md`.

## Add an API endpoint

Use a Nest controller for routing and a service for business logic. DTOs use class-validator; `ValidationPipe` rejects unknown fields. Apply `SessionGuard` to protected routes, scope each database query by the authenticated user, document the endpoint with Swagger decorators, and avoid returning hashes or tokens.

## Add a database model

Update `apps/api/prisma/schema.prisma`, generate the client, create a migration, add indexes/constraints, and write a fictional seed only when useful. Wrap multi-record wallet/ledger changes in `prisma.$transaction`. Never store card numbers or payment secrets.

## Debugging and workflow

- Start services with `docker compose up -d` and apps with `npm run dev`.
- To run apps separately, use `npm run web:dev` or `npm run api:dev`.
- Inspect Swagger at `http://localhost:4000/api/docs`.
- Check environment configuration in `.env`; never commit it.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before review.
- For responsive checks, review at phone, tablet, and desktop widths. Keep account content centered and avoid horizontal overflow.

## Deployment

The current mock build is development-only. A production deployment needs TLS, unique secrets, secure cookies, managed PostgreSQL/Redis, migrations on release, rate limits, structured redacted logs, backup/restore, provider webhook signing, session invalidation, monitoring, and independent security review. Disable development seed and mock payment flows in production.
