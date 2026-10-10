# OlaPay Recreation Implementation Plan

## Discovery baseline

The authenticated reference has a phone-width, dark interface with a fixed bottom navigation: Home, Deposit, UPI, Team, and Me. Verified routes and visible features are recorded in [FEATURE-INVENTORY.md](FEATURE-INVENTORY.md). The workspace began empty, so implementation needs to create the application and infrastructure from scratch.

## Architecture

- Monorepo with `apps/web` (Next.js, React, TypeScript, Tailwind) and `apps/api` (NestJS REST API).
- PostgreSQL with Prisma for users, sessions, wallets, ledger entries, UPI accounts, deposits, orders, referrals, and notifications only where backed by observed requirements.
- Redis/BullMQ for background mock provider jobs and notifications; Docker Compose for local PostgreSQL and Redis.
- Authentication uses hashed passwords, short-lived access tokens, rotated/revocable refresh sessions, and HTTP-only secure cookies.
- Payment/UPI operations use provider interfaces. Local mode is mock-only and never claims a live transfer occurred.
- Seed only fictional development users and transactions. No reference credentials, identifiers, invite codes, or payment destinations are to enter source control.

## Phases

1. **Discovery and inventory** — completed for the accessible signed-in surfaces; financial, credential-change, and setup flows were not triggered. See inventory for remaining unknowns.
2. **Project foundation** — create workspace packages, lint/typecheck/build scripts, environment example, Docker Compose, and CI.
3. **Data model and seed** — schema and fictional seed records for profile, wallet snapshot, ledger, deposits/orders, UPI status, team aggregates, and notifications.
4. **Authentication** — login/logout/session rotation, route guards, rate limiting, and expiring local SMS-mock password recovery are implemented. Persistent audit events remain open.
5. **Backend APIs** — validated profile, dashboard, deposit, UPI list, history, team, help, and notification endpoints with OpenAPI documentation.
6. **Frontend shell** — responsive app canvas, design tokens, bottom navigation, shared cards/forms/tabs/dialogs, loading/empty/error states.
7. **Core views** — login, Home, Deposit USDT/INR, UPI management, Team, Me, profile, help, and histories.
8. **Mock workflows** — simulated deposit and payment lifecycle, UPI linking state machine, transfer review/receipt, idempotency, and provider webhook simulator.
9. **Hardening and QA** — security review, responsive checks, lint/typecheck/build and workflow verification when dependencies/runtime are available.
10. **Documentation** — README, environment, API, architecture, and developer guides synchronized with implemented behavior.

## Inference and open questions

- “Quota,” referral commissions, payment-task offers, and token history are inferred to be distinct ledger/order concepts based on their labels; exact production settlement rules were not visible and must remain mock-configurable.
- The public page has no registration entry point visible on login. A local demo registration route is not planned unless later reference evidence requires it.
- Production authentication, SMS/OTP, UPI verification, and payment providers cannot be inferred from UI alone. They remain service interfaces with local mock implementations.
- The reference session was exposed only through the Codex in-app browser during this inspection. The separate Brave session was not available through the current browser controls.
