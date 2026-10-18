-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'QUOTATION', 'PURCHASE_ORDER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerSource" AS ENUM ('MANUAL', 'WEBSITE');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "gstin" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "stateCode" TEXT,
    "source" "CustomerSource" NOT NULL DEFAULT 'MANUAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_people" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "number" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "partyName" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "publicToken" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequences" (
    "type" "DocumentType" NOT NULL,
    "period" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("type","period")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_gstin_key" ON "customers"("gstin");

-- CreateIndex
CREATE INDEX "contact_people_customerId_idx" ON "contact_people"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_orderId_key" ON "documents"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_publicToken_key" ON "documents"("publicToken");

-- CreateIndex
CREATE INDEX "documents_type_issueDate_idx" ON "documents"("type", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "documents_type_number_key" ON "documents"("type", "number");

-- AddForeignKey
ALTER TABLE "contact_people" ADD CONSTRAINT "contact_people_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

