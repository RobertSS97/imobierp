-- ============================================================
-- ImobiERP - Setup Completo para Supabase
-- Execute este SQL no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ovfkztxbuoogqjbskaaj/sql
-- ============================================================

-- =================== PARTE 1: ENUMS ==========================

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "OwnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'STUDIO');
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');
CREATE TYPE "DepositType" AS ENUM ('CASH', 'BANK_GUARANTEE', 'INSURANCE');
CREATE TYPE "ReadjustmentIndex" AS ENUM ('IGPM', 'IPCA', 'INPC');
CREATE TYPE "ChargeType" AS ENUM ('RENT', 'CONDO_FEE', 'IPTU', 'WATER', 'ELECTRICITY', 'GAS', 'OTHER');
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'BOLETO', 'TRANSFER', 'CASH', 'CREDIT_CARD');
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'ID_DOCUMENT', 'PROOF_INCOME', 'PROOF_ADDRESS', 'PHOTO', 'OTHER');
CREATE TYPE "HistoryEntityType" AS ENUM ('PROPERTY', 'TENANT', 'OWNER', 'CONTRACT', 'CHARGE', 'DOCUMENT', 'USER');
CREATE TYPE "HistoryAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- =================== PARTE 2: TABELAS ========================

CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "plan" "PlanType" NOT NULL DEFAULT 'STARTER',
    "planExpiresAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "companyName" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "companyStreet" TEXT,
    "companyNumber" TEXT,
    "companyComplement" TEXT,
    "companyNeighborhood" TEXT,
    "companyCity" TEXT,
    "companyState" TEXT,
    "companyZipCode" TEXT,
    "creciNumber" TEXT,
    "creciState" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappApiUrl" TEXT,
    "whatsappApiKey" TEXT,
    "whatsappInstanceName" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "autoChargeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoChargeDay" INTEGER NOT NULL DEFAULT 5,
    "lateFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "interestPercentage" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Owner" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "cpfCnpj" TEXT NOT NULL,
    "rg" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "bankAccountType" "BankAccountType",
    "pixKey" TEXT,
    "status" "OwnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "maritalStatus" "MaritalStatus",
    "profession" TEXT,
    "income" DOUBLE PRECISION,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelationship" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Property" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
    "area" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rentValue" DOUBLE PRECISION NOT NULL,
    "condoFee" DOUBLE PRECISION,
    "iptu" DOUBLE PRECISION,
    "description" TEXT,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentValue" DOUBLE PRECISION NOT NULL,
    "condoFee" DOUBLE PRECISION,
    "iptu" DOUBLE PRECISION,
    "depositValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositType" "DepositType" NOT NULL DEFAULT 'CASH',
    "paymentDay" INTEGER NOT NULL DEFAULT 5,
    "readjustmentIndex" "ReadjustmentIndex" NOT NULL DEFAULT 'IGPM',
    "readjustmentMonth" INTEGER NOT NULL DEFAULT 12,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContractClause" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractClause_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Charge" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "ChargeType" NOT NULL,
    "description" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "penaltyValue" DOUBLE PRECISION,
    "interestValue" DOUBLE PRECISION,
    "discountValue" DOUBLE PRECISION,
    "notes" TEXT,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSentAt" TIMESTAMP(3),
    "whatsappMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "tenantId" TEXT,
    "contractId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HistoryLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "entityType" "HistoryEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "HistoryAction" NOT NULL,
    "description" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoryLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "templateName" TEXT,
    "status" "WhatsappMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "externalId" TEXT,
    "errorMessage" TEXT,
    "chargeId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxProperties" INTEGER NOT NULL DEFAULT 10,
    "maxTenants" INTEGER NOT NULL DEFAULT 10,
    "maxOwners" INTEGER NOT NULL DEFAULT 10,
    "maxContracts" INTEGER NOT NULL DEFAULT 10,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "stripePaymentId" TEXT,
    "stripeInvoiceId" TEXT,
    "description" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- =================== PARTE 3: INDEXES ========================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Owner_userId_idx" ON "Owner"("userId");
CREATE INDEX "Owner_cpfCnpj_idx" ON "Owner"("cpfCnpj");
CREATE INDEX "Owner_email_idx" ON "Owner"("email");
CREATE INDEX "Tenant_userId_idx" ON "Tenant"("userId");
CREATE INDEX "Tenant_cpf_idx" ON "Tenant"("cpf");
CREATE INDEX "Tenant_email_idx" ON "Tenant"("email");
CREATE INDEX "Property_userId_idx" ON "Property"("userId");
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX "Property_status_idx" ON "Property"("status");
CREATE INDEX "Property_city_state_idx" ON "Property"("city", "state");
CREATE INDEX "Contract_userId_idx" ON "Contract"("userId");
CREATE INDEX "Contract_propertyId_idx" ON "Contract"("propertyId");
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");
CREATE INDEX "Contract_ownerId_idx" ON "Contract"("ownerId");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");
CREATE INDEX "ContractClause_contractId_idx" ON "ContractClause"("contractId");
CREATE INDEX "Charge_userId_idx" ON "Charge"("userId");
CREATE INDEX "Charge_contractId_idx" ON "Charge"("contractId");
CREATE INDEX "Charge_tenantId_idx" ON "Charge"("tenantId");
CREATE INDEX "Charge_propertyId_idx" ON "Charge"("propertyId");
CREATE INDEX "Charge_status_idx" ON "Charge"("status");
CREATE INDEX "Charge_dueDate_idx" ON "Charge"("dueDate");
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");
CREATE INDEX "Document_contractId_idx" ON "Document"("contractId");
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "HistoryLog_userId_idx" ON "HistoryLog"("userId");
CREATE INDEX "HistoryLog_entityType_entityId_idx" ON "HistoryLog"("entityType", "entityId");
CREATE INDEX "HistoryLog_createdAt_idx" ON "HistoryLog"("createdAt");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "WhatsappMessage_userId_idx" ON "WhatsappMessage"("userId");
CREATE INDEX "WhatsappMessage_chargeId_idx" ON "WhatsappMessage"("chargeId");
CREATE INDEX "WhatsappMessage_status_idx" ON "WhatsappMessage"("status");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_slug_idx" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");
CREATE INDEX "PaymentLog_userId_idx" ON "PaymentLog"("userId");
CREATE INDEX "PaymentLog_status_idx" ON "PaymentLog"("status");
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- =================== PARTE 4: FOREIGN KEYS ===================

ALTER TABLE "Owner" ADD CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractClause" ADD CONSTRAINT "ContractClause_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistoryLog" ADD CONSTRAINT "HistoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =================== PARTE 5: PRISMA MIGRATIONS TABLE ========
-- (Necessária para o Prisma saber que a migration já foi aplicada)

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
VALUES (gen_random_uuid()::text, 'manual_setup', '20260303000000_init', now(), 1);

-- =================== PARTE 6: SEED DATA ======================

-- Admin User (email: admin@imobierp.com, senha: Admin@2024!)
INSERT INTO "AdminUser" ("id", "email", "name", "passwordHash", "isActive", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'admin@imobierp.com',
    'Robert',
    '$2b$12$.jNDOKxt/KmtmIRwuFIabOJvfhBChOewn4yKSVwQJiFw2jJUvzo42',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Plano Starter
INSERT INTO "SubscriptionPlan" ("id", "name", "slug", "description", "price", "billingCycle", "isActive", "isPopular", "sortOrder", "maxProperties", "maxTenants", "maxOwners", "maxContracts", "maxUsers", "features", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Starter', 'starter',
    'Para corretores autônomos e pequenas imobiliárias',
    49.90, 'MONTHLY', true, false, 1, 15, 15, 10, 15, 1,
    ARRAY['Até 15 imóveis', 'Até 15 inquilinos', 'Contratos digitais', 'Cobranças automáticas', 'Relatórios básicos', 'Suporte por email'],
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Plano Professional
INSERT INTO "SubscriptionPlan" ("id", "name", "slug", "description", "price", "billingCycle", "isActive", "isPopular", "sortOrder", "maxProperties", "maxTenants", "maxOwners", "maxContracts", "maxUsers", "features", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Professional', 'professional',
    'Para imobiliárias em crescimento',
    99.90, 'MONTHLY', true, true, 2, 50, 50, 30, 50, 3,
    ARRAY['Até 50 imóveis', 'Até 50 inquilinos', 'Contratos digitais', 'Cobranças automáticas', 'Relatórios avançados', 'WhatsApp integrado', 'Documentos ilimitados', 'Suporte prioritário'],
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Plano Enterprise
INSERT INTO "SubscriptionPlan" ("id", "name", "slug", "description", "price", "billingCycle", "isActive", "isPopular", "sortOrder", "maxProperties", "maxTenants", "maxOwners", "maxContracts", "maxUsers", "features", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Enterprise', 'enterprise',
    'Para grandes imobiliárias e redes',
    199.90, 'MONTHLY', true, false, 3, 999, 999, 999, 999, 10,
    ARRAY['Imóveis ilimitados', 'Inquilinos ilimitados', 'Contratos digitais', 'Cobranças automáticas', 'Relatórios avançados', 'WhatsApp integrado', 'Documentos ilimitados', 'API personalizada', 'Multi-usuários', 'Suporte dedicado 24/7'],
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- System Settings
INSERT INTO "SystemSettings" ("id", "key", "value", "type", "updatedAt") VALUES (gen_random_uuid()::text, 'trial_days', '7', 'number', CURRENT_TIMESTAMP);
INSERT INTO "SystemSettings" ("id", "key", "value", "type", "updatedAt") VALUES (gen_random_uuid()::text, 'app_name', 'ImobiERP', 'string', CURRENT_TIMESTAMP);
INSERT INTO "SystemSettings" ("id", "key", "value", "type", "updatedAt") VALUES (gen_random_uuid()::text, 'support_email', 'suporte@imobierp.com', 'string', CURRENT_TIMESTAMP);
INSERT INTO "SystemSettings" ("id", "key", "value", "type", "updatedAt") VALUES (gen_random_uuid()::text, 'require_email_verification', 'false', 'boolean', CURRENT_TIMESTAMP);
INSERT INTO "SystemSettings" ("id", "key", "value", "type", "updatedAt") VALUES (gen_random_uuid()::text, 'maintenance_mode', 'false', 'boolean', CURRENT_TIMESTAMP);
INSERT INTO "SystemSettings" ("id", "key", "value", "type", "updatedAt") VALUES (gen_random_uuid()::text, 'stripe_enabled', 'false', 'boolean', CURRENT_TIMESTAMP);

-- =================== SETUP COMPLETO! ==========================
-- Tabelas: 15 criadas
-- Admin: admin@imobierp.com / Admin@2024!
-- Planos: 3 (Starter, Professional, Enterprise)
-- Configurações: 6 settings
-- ============================================================
