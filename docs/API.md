# API reference

Base URL: `http://localhost:4000/api/v1`

Interactive OpenAPI: `http://localhost:4000/api/docs`
Authenticated endpoints use the HTTP-only `olapay_access` cookie. Login/refresh set cookies; logout revokes the refresh session. Errors use NestJS HTTP status codes and validation messages.

## Authentication

### `POST /auth/login`

Public. Request: `{ "phone": "9000000001", "password": "DemoPass!234" }` (development seed only). Response: `{ "user": { "id": "…", "phone": "…", "role": "USER" } }`; access and refresh cookies are set. Errors: `400` invalid body, `401` invalid credentials.

### `POST /auth/refresh`

Public via refresh cookie. Rotates refresh session and access cookie. Errors: `401` expired, revoked, or invalid session.

### `POST /auth/logout`

Public via refresh cookie. Revokes session and clears cookies. Response: `{ "ok": true }`.

### `POST /auth/recovery/start` and `POST /auth/recovery/complete`

Public and limited to five requests per minute per endpoint. Start accepts `{ "phone": "9000000001" }` and returns the same generic message whether or not the account exists. With `SMS_MODE=mock` outside production, the development response also includes `mockCode`; codes expire after five minutes and allow five attempts. Complete accepts `{ "phone": "9000000001", "code": "123456", "password": "NewDemoPass!234" }`, hashes the new password, consumes the code, and revokes the account's sessions. Recovery codes are held in process memory for local development; configure a persistent SMS provider and shared secure token storage before multi-instance deployment.

### `GET /auth/me`

Authenticated. Returns current user ID, phone, role, and account status. Errors: `401` unauthenticated/expired.

## Dashboard and team

### `GET /profile`

Authenticated. Returns the signed-in user's ID, phone, role, and whether a PIN is configured. It never returns credential hashes.

### `PATCH /profile/pin`

Authenticated and limited to five attempts per minute. Body: `{ "currentPassword": "DemoPass!234", "pin": "123456" }`. Verifies the current account password and stores the six-digit PIN as an Argon2 hash. Errors: `400` invalid PIN shape, `401` wrong password or expired session, `429` rate limit.

### `GET /dashboard`

Authenticated. Returns `quotaInr`, `rewardRatio`, `usdtRateInr`, `todayReceived`, `inTransaction`, and `mockMode` from server-side wallet data/config.

### `GET /team`

Authenticated. Returns aggregate member count, recharge/commission totals, and a limited list of member IDs and aggregate values scoped to the current owner.

## Deposits

### `GET /deposits/offers`

Authenticated. Returns mock rate/bonus configuration and sample Payment/VIP offer amounts. These values are local examples, not production offers.

### `POST /deposits`

Authenticated. Headers: optional `Idempotency-Key`. Body: `{ "currency": "INR" | "USDT", "amount": 100, "network": "TRC-20" | "BEP-20", "offerKind": "Payment" | "VIP" }`. The server enforces listed INR offer amounts and USDT limits, and recalculates totals with decimal arithmetic. A queued mock job advances the order through `PROCESSING` to `PENDING`; it never settles money. Errors: `400` invalid amount/network/idempotency conflict, `401` unauthenticated.

### `POST /payments/mock` and `GET /payments/mock`

Authenticated. Create body: `{ "kind": "RECEIVE" | "SEND", "amount": 100, "recipient": "demo-recipient" }`. A recipient is required for `SEND`. The endpoint records an `INITIATED` mock intent and enqueues the same local state lifecycle; it does not transfer funds. `Idempotency-Key` is accepted. GET returns only the current user's most recent mock intents.

## UPI accounts

### `GET /upis`

Authenticated. Returns current user's account IDs, addresses, status, and sell flag. Sensitive IDs are never returned for other users.

### `POST /upis`

Authenticated. Body: `{ "address": "demo@mock" }`. Creates a local pending-verification record only. Production UPI verification is not integrated. Errors: `400` invalid address / duplicate, `401` unauthenticated.

### `PATCH /upis/{id}/sell`

Authenticated and ownership-scoped. Body: `{ "sellEnabled": true }`. Updates only an available account. Errors: `404` not found/available, `400` invalid body, `401` unauthenticated.

### `PATCH /upis/{id}/link`

Authenticated and ownership-scoped. Requests local verification for an unavailable account and moves it to `PENDING_VERIFICATION`. It does not connect to a payment network.

## History

### `GET /history/recharges`

Authenticated. Returns up to 50 most recent deposit orders for the current user. Query filtering and pagination remain to be added.

### `GET /history/tokens`

Authenticated. Returns up to 100 most recent ledger rows for the current user. Query filtering and pagination remain to be added.

## Remaining production integrations

Account/PIN changes, authenticator enrollment, transfer/payment-request endpoints, notifications, and signed provider webhooks remain unimplemented. Never treat a local `PENDING` payment response as evidence that funds were received.
