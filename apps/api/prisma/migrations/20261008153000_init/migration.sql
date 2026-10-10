-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'USDT');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('INITIATED', 'PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "UpiStatus" AS ENUM ('PENDING_VERIFICATION', 'AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "PaymentIntentKind" AS ENUM ('RECEIVE', 'SEND');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('RECHARGE', 'REWARD', 'ACTIVITY_REWARD', 'COMMISSION', 'RECEIVE', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'PAYMENT_TASK', 'PAYMENT_TASK_REWARD', 'INVITE_RECHARGE_ACTIVITY', 'ORDER_BALANCE_TRANSFER', 'GAME_BALANCE_EXCHANGE', 'GAME_WITHDRAWAL', 'TASK_REWARD', 'WITHDRAW_APPLY', 'WITHDRAW_REFUND', 'WITHDRAW_SUCCESS');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(24) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" VARCHAR(24) NOT NULL DEFAULT 'USER',
    "status" VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quotaInr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "rewardRatio" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositOrder" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currency" "Currency" NOT NULL,
    "network" VARCHAR(20),
    "amount" DECIMAL(18,2) NOT NULL,
    "quotedRate" DECIMAL(18,6) NOT NULL,
    "bonusAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "quotaAmount" DECIMAL(18,2) NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'INITIATED',
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "PaymentIntentKind" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "recipient" VARCHAR(120),
    "status" "DepositStatus" NOT NULL DEFAULT 'INITIATED',
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" VARCHAR(280) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpiAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "address" VARCHAR(120) NOT NULL,
    "status" "UpiStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "sellEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpiAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "rechargeTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "commissionTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_expiresAt_idx" ON "RefreshSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositOrder_idempotencyKey_key" ON "DepositOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DepositOrder_userId_currency_status_createdAt_idx" ON "DepositOrder"("userId", "currency", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_userId_kind_status_createdAt_idx" ON "PaymentIntent"("userId", "kind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_type_createdAt_idx" ON "LedgerEntry"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "UpiAccount_userId_status_idx" ON "UpiAccount"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UpiAccount_userId_address_key" ON "UpiAccount"("userId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_memberId_key" ON "TeamMember"("memberId");

-- CreateIndex
CREATE INDEX "TeamMember_ownerId_joinedAt_idx" ON "TeamMember"("ownerId", "joinedAt");

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositOrder" ADD CONSTRAINT "DepositOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpiAccount" ADD CONSTRAINT "UpiAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
