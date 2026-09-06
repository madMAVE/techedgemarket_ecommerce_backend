-- AlterTable: Change category from enum to text
ALTER TABLE "products" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

-- DropEnum: Drop the ProductCategory enum as it's no longer used
DROP TYPE "ProductCategory";
