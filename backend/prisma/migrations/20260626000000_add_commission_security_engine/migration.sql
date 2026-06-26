-- ─── New Enums ─────────────────────────────────────────────────────────────────
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'TIERED', 'HYBRID');
CREATE TYPE "CommissionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'EXPIRED');
CREATE TYPE "LedgerEntryType" AS ENUM ('BOOKING_CREATED', 'DEPOSIT_PAID', 'INSTALLMENT_PAID', 'COMMISSION_CALCULATED', 'COMMISSION_REVERSED', 'REFUND_ISSUED', 'VENDOR_PAID', 'SERVICE_FEE_COLLECTED', 'SERVICE_FEE_REVERSED', 'SUBSCRIPTION_PURCHASED', 'CHARGEBACK', 'PENALTY', 'ADJUSTMENT', 'ESCROW_HELD', 'ESCROW_RELEASED', 'WITHDRAWAL_PROCESSED', 'PLATFORM_REVENUE');
CREATE TYPE "LedgerAccountType" AS ENUM ('CLIENT', 'VENDOR', 'PLATFORM', 'ESCROW', 'SUBSCRIPTION', 'ADVERTISING');
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED', 'DISPUTED');
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'WITHDRAWAL', 'ADJUSTMENT', 'REFUND');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'SILVER', 'GOLD', 'PLATINUM', 'ENTERPRISE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRIAL', 'CANCELLED', 'GRACE_PERIOD', 'EXPIRED');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_CLIENT', 'RESOLVED_VENDOR', 'ESCALATED', 'CLOSED');
CREATE TYPE "FraudAlertStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "RefundType" AS ENUM ('FULL', 'PARTIAL', 'CHARGEBACK', 'DISPUTE_RESOLUTION', 'MANUAL_ADJUSTMENT');
CREATE TYPE "SettlementFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'MANUAL');

-- ─── ALTER: users — add security columns ───────────────────────────────────────
ALTER TABLE "users"
  ADD COLUMN "twoFactorBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN "passwordHistory" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ─── ALTER: refresh_tokens — replace token with tokenHash + add security cols ──
ALTER TABLE "refresh_tokens"
  ADD COLUMN "tokenHash" VARCHAR(255),
  ADD COLUMN "family" VARCHAR(64),
  ADD COLUMN "deviceName" VARCHAR(255),
  ADD COLUMN "browser" VARCHAR(100),
  ADD COLUMN "os" VARCHAR(100),
  ADD COLUMN "country" VARCHAR(100),
  ADD COLUMN "revokeReason" VARCHAR(100),
  ADD COLUMN "lastUsedAt" TIMESTAMP(3);

-- Backfill: copy existing token values into tokenHash so NOT NULL can be applied
UPDATE "refresh_tokens" SET "tokenHash" = "token" WHERE "tokenHash" IS NULL;
UPDATE "refresh_tokens" SET "family" = gen_random_uuid()::text WHERE "family" IS NULL;

-- Now make required columns non-nullable and add unique constraint
ALTER TABLE "refresh_tokens"
  ALTER COLUMN "tokenHash" SET NOT NULL,
  ALTER COLUMN "family" SET NOT NULL;

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- ─── ALTER: otps — replace code with codeHash + add attempts ───────────────────
ALTER TABLE "otps"
  ADD COLUMN "codeHash" VARCHAR(255),
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing code values into codeHash
UPDATE "otps" SET "codeHash" = "code" WHERE "codeHash" IS NULL;
ALTER TABLE "otps" ALTER COLUMN "codeHash" SET NOT NULL;

-- ─── ALTER: sessions — add security columns ────────────────────────────────────
ALTER TABLE "sessions"
  ADD COLUMN "tokenHash" VARCHAR(255),
  ADD COLUMN "deviceName" VARCHAR(255),
  ADD COLUMN "browser" VARCHAR(100),
  ADD COLUMN "os" VARCHAR(100),
  ADD COLUMN "country" VARCHAR(100),
  ADD COLUMN "lastActivityAt" TIMESTAMP(3),
  ADD COLUMN "lastRefreshAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3);

UPDATE "sessions" SET "tokenHash" = "token" WHERE "tokenHash" IS NULL;
ALTER TABLE "sessions" ALTER COLUMN "tokenHash" SET NOT NULL;
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- ─── ALTER: bookings — add financial columns ───────────────────────────────────
ALTER TABLE "bookings"
  ADD COLUMN "platformFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "platformFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN "completedAt" TIMESTAMP(3);

-- ─── ALTER: vendor_categories — (no new columns, relation only in Prisma) ───────

-- ─── SecurityEvent table ────────────────────────────────────────────────────────
CREATE TABLE "security_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "eventType" VARCHAR(100) NOT NULL,
  "ipAddress" VARCHAR(50),
  "userAgent" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "security_events_userId_idx" ON "security_events"("userId");
CREATE INDEX "security_events_eventType_idx" ON "security_events"("eventType");
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CommissionSettings ─────────────────────────────────────────────────────────
CREATE TABLE "commission_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "globalDefaultRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
  "platformFeeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.03,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "settlementFrequency" "SettlementFrequency" NOT NULL DEFAULT 'WEEKLY',
  "settlementDayOfWeek" INTEGER NOT NULL DEFAULT 1,
  "settlementDayOfMonth" INTEGER NOT NULL DEFAULT 1,
  "minWithdrawalAmount" DECIMAL(12,2) NOT NULL DEFAULT 100,
  "maxWithdrawalAmount" DECIMAL(12,2) NOT NULL DEFAULT 500000,
  "escrowHoldDays" INTEGER NOT NULL DEFAULT 7,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedById" UUID,
  CONSTRAINT "commission_settings_pkey" PRIMARY KEY ("id")
);

-- ─── CommissionRule ─────────────────────────────────────────────────────────────
CREATE TABLE "commission_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
  "status" "CommissionStatus" NOT NULL DEFAULT 'ACTIVE',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "vendorId" UUID UNIQUE,
  "categoryId" UUID,
  "subscriptionTier" "SubscriptionTier",
  "campaignId" UUID,
  "rate" DECIMAL(5,4),
  "fixedAmount" DECIMAL(12,2),
  "tiers" JSONB,
  "minAmount" DECIMAL(12,2),
  "maxAmount" DECIMAL(12,2),
  "region" VARCHAR(100),
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commission_rules_vendorId_idx" ON "commission_rules"("vendorId");
CREATE INDEX "commission_rules_categoryId_idx" ON "commission_rules"("categoryId");
CREATE INDEX "commission_rules_status_isEnabled_idx" ON "commission_rules"("status", "isEnabled");
CREATE INDEX "commission_rules_priority_idx" ON "commission_rules"("priority");
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "vendor_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── CommissionCampaign ─────────────────────────────────────────────────────────
CREATE TABLE "commission_campaigns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "discountRate" DECIMAL(5,4) NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "maxBookings" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_campaigns_pkey" PRIMARY KEY ("id")
);

-- ─── CommissionTransaction ──────────────────────────────────────────────────────
CREATE TABLE "commission_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bookingId" UUID NOT NULL,
  "paymentId" UUID,
  "vendorId" UUID NOT NULL,
  "ruleId" UUID,
  "grossAmount" DECIMAL(12,2) NOT NULL,
  "commissionRate" DECIMAL(5,4) NOT NULL,
  "commissionAmount" DECIMAL(12,2) NOT NULL,
  "platformFeeRate" DECIMAL(5,4) NOT NULL,
  "platformFeeAmount" DECIMAL(12,2) NOT NULL,
  "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "vendorNetPayout" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "settledAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "reversalReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commission_transactions_bookingId_idx" ON "commission_transactions"("bookingId");
CREATE INDEX "commission_transactions_vendorId_idx" ON "commission_transactions"("vendorId");
CREATE INDEX "commission_transactions_status_idx" ON "commission_transactions"("status");
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_ruleId_fkey"
  FOREIGN KEY ("ruleId") REFERENCES "commission_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── FinancialLedger ────────────────────────────────────────────────────────────
CREATE TABLE "financial_ledger" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entryType" "LedgerEntryType" NOT NULL,
  "accountType" "LedgerAccountType" NOT NULL,
  "accountId" UUID NOT NULL,
  "referenceId" UUID,
  "referenceType" VARCHAR(50),
  "debitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "creditAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "balance" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "description" TEXT,
  "reversalOf" UUID,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" UUID,
  CONSTRAINT "financial_ledger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "financial_ledger_accountId_accountType_idx" ON "financial_ledger"("accountId", "accountType");
CREATE INDEX "financial_ledger_referenceId_referenceType_idx" ON "financial_ledger"("referenceId", "referenceType");
CREATE INDEX "financial_ledger_entryType_idx" ON "financial_ledger"("entryType");
CREATE INDEX "financial_ledger_createdAt_idx" ON "financial_ledger"("createdAt");

-- ─── EscrowAccount ──────────────────────────────────────────────────────────────
CREATE TABLE "escrow_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bookingId" UUID NOT NULL UNIQUE,
  "vendorId" UUID NOT NULL,
  "grossAmount" DECIMAL(12,2) NOT NULL,
  "commissionAmount" DECIMAL(12,2) NOT NULL,
  "platformFeeAmount" DECIMAL(12,2) NOT NULL,
  "vendorNetAmount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
  "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releaseAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "disputeId" UUID,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "escrow_accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "escrow_accounts_vendorId_status_idx" ON "escrow_accounts"("vendorId", "status");
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── EscrowTransaction ──────────────────────────────────────────────────────────
CREATE TABLE "escrow_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "escrowId" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "description" TEXT,
  "performedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "escrow_transactions_escrowId_idx" ON "escrow_transactions"("escrowId");
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_escrowId_fkey"
  FOREIGN KEY ("escrowId") REFERENCES "escrow_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── VendorWallet ───────────────────────────────────────────────────────────────
CREATE TABLE "vendor_wallets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendorId" UUID NOT NULL UNIQUE,
  "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "pendingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "heldBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "lifetimeEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalCommissionPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalWithdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalRefunds" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "bankName" VARCHAR(255),
  "bankAccountNumber" VARCHAR(255),
  "bankAccountName" VARCHAR(255),
  "telebirrNumber" VARCHAR(20),
  "chapaAccountRef" VARCHAR(255),
  "isPayoutEnabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_wallets_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "vendor_wallets" ADD CONSTRAINT "vendor_wallets_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── WalletTransaction ──────────────────────────────────────────────────────────
CREATE TABLE "wallet_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "walletId" UUID NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "balanceBefore" DECIMAL(12,2) NOT NULL,
  "balanceAfter" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "description" TEXT,
  "referenceId" UUID,
  "referenceType" VARCHAR(50),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");
CREATE INDEX "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "vendor_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── WithdrawalRequest ──────────────────────────────────────────────────────────
CREATE TABLE "withdrawal_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "walletId" UUID NOT NULL,
  "vendorId" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "method" VARCHAR(50) NOT NULL,
  "bankName" VARCHAR(255),
  "accountNumber" VARCHAR(255),
  "accountName" VARCHAR(255),
  "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" UUID,
  "processedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "transactionRef" VARCHAR(255),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "withdrawal_requests_vendorId_status_idx" ON "withdrawal_requests"("vendorId", "status");
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "vendor_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── SettlementBatch ────────────────────────────────────────────────────────────
CREATE TABLE "settlement_batches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "batchNumber" VARCHAR(30) NOT NULL UNIQUE,
  "frequency" "SettlementFrequency" NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "totalGrossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalCommission" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalPlatformFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalNetPayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "vendorCount" INTEGER NOT NULL DEFAULT 0,
  "bookingCount" INTEGER NOT NULL DEFAULT 0,
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "processedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" UUID,
  CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "settlement_batches_status_idx" ON "settlement_batches"("status");
CREATE INDEX "settlement_batches_period_idx" ON "settlement_batches"("periodStart", "periodEnd");

-- ─── VendorSettlement ───────────────────────────────────────────────────────────
CREATE TABLE "vendor_settlements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "settlementNumber" VARCHAR(30) NOT NULL UNIQUE,
  "batchId" UUID NOT NULL,
  "vendorId" UUID NOT NULL,
  "bookingId" UUID UNIQUE,
  "grossAmount" DECIMAL(12,2) NOT NULL,
  "commissionAmount" DECIMAL(12,2) NOT NULL,
  "platformFeeAmount" DECIMAL(12,2) NOT NULL,
  "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "netPayout" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "paymentRef" VARCHAR(255),
  "invoiceUrl" VARCHAR(500),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_settlements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_settlements_vendorId_status_idx" ON "vendor_settlements"("vendorId", "status");
CREATE INDEX "vendor_settlements_batchId_idx" ON "vendor_settlements"("batchId");
ALTER TABLE "vendor_settlements" ADD CONSTRAINT "vendor_settlements_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "settlement_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_settlements" ADD CONSTRAINT "vendor_settlements_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── PlatformRevenue ────────────────────────────────────────────────────────────
CREATE TABLE "platform_revenue" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "category" VARCHAR(100) NOT NULL,
  "sourceId" UUID,
  "sourceType" VARCHAR(50),
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "description" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_revenue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "platform_revenue_category_idx" ON "platform_revenue"("category");
CREATE INDEX "platform_revenue_recordedAt_idx" ON "platform_revenue"("recordedAt");

-- ─── SubscriptionPlan ───────────────────────────────────────────────────────────
CREATE TABLE "subscription_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tier" "SubscriptionTier" NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "monthlyPrice" DECIMAL(12,2) NOT NULL,
  "quarterlyPrice" DECIMAL(12,2) NOT NULL,
  "yearlyPrice" DECIMAL(12,2) NOT NULL,
  "commissionRate" DECIMAL(5,4) NOT NULL,
  "features" JSONB,
  "maxListings" INTEGER,
  "priorityRanking" INTEGER NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "hasAnalytics" BOOLEAN NOT NULL DEFAULT false,
  "hasEarlyPayout" BOOLEAN NOT NULL DEFAULT false,
  "hasDedicatedManager" BOOLEAN NOT NULL DEFAULT false,
  "hasApiAccess" BOOLEAN NOT NULL DEFAULT false,
  "trialDays" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- ─── VendorSubscription ─────────────────────────────────────────────────────────
CREATE TABLE "vendor_subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendorId" UUID NOT NULL UNIQUE,
  "planId" UUID NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "billingCycle" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "trialEndsAt" TIMESTAMP(3),
  "graceEndsAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "renewedAt" TIMESTAMP(3),
  "proratedAmount" DECIMAL(12,2),
  "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP(3),
  "autoRenew" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_subscriptions_status_idx" ON "vendor_subscriptions"("status");
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── SubscriptionPayment ────────────────────────────────────────────────────────
CREATE TABLE "subscription_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "subscriptionId" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'ETB',
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "billingPeriod" VARCHAR(50) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "invoiceUrl" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "subscription_payments_subscriptionId_idx" ON "subscription_payments"("subscriptionId");
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "vendor_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Dispute ────────────────────────────────────────────────────────────────────
CREATE TABLE "disputes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bookingId" UUID NOT NULL,
  "initiatedById" UUID NOT NULL,
  "againstId" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" TEXT,
  "resolvedById" UUID,
  "resolvedAt" TIMESTAMP(3),
  "escrowHeld" BOOLEAN NOT NULL DEFAULT true,
  "disputedAmount" DECIMAL(12,2) NOT NULL,
  "refundAmount" DECIMAL(12,2),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "disputes_bookingId_idx" ON "disputes"("bookingId");
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- ─── DisputeEvidence ────────────────────────────────────────────────────────────
CREATE TABLE "dispute_evidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "disputeId" UUID NOT NULL,
  "submittedById" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "content" TEXT NOT NULL,
  "fileUrl" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_disputeId_fkey"
  FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── RefundRequest ──────────────────────────────────────────────────────────────
CREATE TABLE "refund_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bookingId" UUID NOT NULL,
  "paymentId" UUID NOT NULL,
  "requestedById" UUID NOT NULL,
  "type" "RefundType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "vendorDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "commissionAdj" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "platformFeeAdj" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "refund_requests_bookingId_idx" ON "refund_requests"("bookingId");
CREATE INDEX "refund_requests_paymentId_idx" ON "refund_requests"("paymentId");

-- ─── FraudAlert ─────────────────────────────────────────────────────────────────
CREATE TABLE "fraud_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "type" VARCHAR(100) NOT NULL,
  "severity" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  "description" TEXT NOT NULL,
  "status" "FraudAlertStatus" NOT NULL DEFAULT 'OPEN',
  "evidence" JSONB,
  "resolvedById" UUID,
  "resolvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fraud_alerts_userId_idx" ON "fraud_alerts"("userId");
CREATE INDEX "fraud_alerts_type_status_idx" ON "fraud_alerts"("type", "status");

-- ─── TaxConfiguration ───────────────────────────────────────────────────────────
CREATE TABLE "tax_configurations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "rate" DECIMAL(5,4) NOT NULL,
  "region" VARCHAR(100),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "appliesTo" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tax_configurations_pkey" PRIMARY KEY ("id")
);

-- ─── Make legacy token column nullable (replaced by tokenHash) ────────────────
-- The original migration created token as NOT NULL; the new auth flow uses tokenHash.
-- Existing rows keep their token values; new rows only need tokenHash.
ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_token_key";
ALTER TABLE "refresh_tokens" ALTER COLUMN "token" DROP NOT NULL;
