-- AlterTable: documents — drop global unique (type, number), add non-unique index
DROP INDEX "documents_type_number_key";
CREATE INDEX "documents_type_number_idx" ON "documents"("type", "number");

-- AlterTable: document_sequences — per-customer counter
ALTER TABLE "document_sequences" ADD COLUMN "customerId" TEXT NOT NULL;
ALTER TABLE "document_sequences" DROP CONSTRAINT "document_sequences_pkey";
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("type", "period", "customerId");
