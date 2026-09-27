-- CreateEnum
CREATE TYPE "OrderTrackingStatus" AS ENUM ('purchased', 'dispatched', 'on_the_way', 'delivered');

-- CreateTable
CREATE TABLE "order_tracking" (
    "orderTrackingId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderTrackingStatus" NOT NULL,
    "location" TEXT[],
    "message" VARCHAR(350) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_tracking_pkey" PRIMARY KEY ("orderTrackingId")
);

-- CreateIndex
CREATE INDEX "order_tracking_orderId_idx" ON "order_tracking"("orderId");

-- AddForeignKey
ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
