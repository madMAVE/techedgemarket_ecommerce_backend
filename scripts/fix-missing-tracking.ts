import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  family: 4 as const,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orders = await prisma.order.findMany({ select: { id: true, orderNumber: true } });
  console.log(`Found ${orders.length} orders`);

  const withTracking = await prisma.orderTracking.findMany({ select: { orderId: true } });
  const trackedIds = new Set(withTracking.map((t) => t.orderId));
  console.log(`Found ${trackedIds.size} tracking entries`);

  const missing = orders.filter((o) => !trackedIds.has(o.id));
  console.log(`Missing tracking for ${missing.length} orders`);

  for (const order of missing) {
    await prisma.orderTracking.create({
      data: {
        orderId: order.id,
        status: "purchased",
        location: [],
        message: "Order has been placed successfully",
      },
    });
    console.log(`  Created tracking for: ${order.orderNumber}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
