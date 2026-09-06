import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcryptjs";
import { AppModule } from "./app.module";
import { PrismaService } from "./common/database/prisma.service";

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log("🌱 Seeding TechEdge Market database...\n");

  // Clear existing data
  await prisma.serviceTicket.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.procurementOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  console.log("✓ Cleared existing data\n");

  const adminHashedPassword = await bcrypt.hash("admin_654321", 12);

  await prisma.admin.create({
    data: {
      username: "admin_321",
      password: adminHashedPassword,
      contact: "+91-40-1234-5678",
    },
  });

  console.log("✓ Seeded admin user");
  console.log("  → Admin login: admin_321 / admin_654321\n");

  const hashedPassword = await bcrypt.hash("Admin@1234", 12);

  // Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Vikram Patel",
        email: "admin@techedgemarket.in",
        password: hashedPassword,
        role: "admin",
        company: "TechEdge Market",
        phone: "+91-40-1234-5678",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Anjali Singh",
        email: "manager@techedgemarket.in",
        password: hashedPassword,
        role: "manager",
        company: "TechEdge Market",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Raj Mehta",
        email: "raj@indopack.in",
        password: hashedPassword,
        role: "customer",
        company: "Indopack Machines Pvt. Ltd.",
        gstin: "27AABCI1234B1Z5",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sameer Kulkarni",
        email: "sameer@autotek.in",
        password: hashedPassword,
        role: "customer",
        company: "AutoTek Manufacturing",
        gstin: "24AABCA9012F1Z2",
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Seeded ${users.length} users`);
  console.log("  → Admin login: admin@techedgemarket.in / Admin@1234\n");

  // Brands
  const brands = await Promise.all([
    prisma.brand.create({
      data: { name: "Siemens", logo: "/techedgemarket_ecommerce/brand-logos/Siemens_logo.png", description: "Global leader in automation and digitalization" },
    }),
    prisma.brand.create({
      data: { name: "ABB", logo: "/techedgemarket_ecommerce/brand-logos/ABB_logo.png", description: "Power and automation technologies" },
    }),
    prisma.brand.create({
      data: { name: "Schneider Electric", logo: "/techedgemarket_ecommerce/brand-logos/Schneider_logo.png", description: "Energy management and automation" },
    }),
    prisma.brand.create({
      data: { name: "SICK", logo: "/techedgemarket_ecommerce/brand-logos/SICK_logo.png", description: "Sensor intelligence for industrial applications" },
    }),
    prisma.brand.create({
      data: { name: "Keyence", logo: "/techedgemarket_ecommerce/brand-logos/Keyence_logo.png", description: "Factory automation and machine vision" },
    }),
  ]);

  const brandMap: Record<string, string> = {
    "Siemens": brands[0].id,
    "ABB": brands[1].id,
    "Schneider Electric": brands[2].id,
    "SICK": brands[3].id,
    "Keyence": brands[4].id,
  };

  console.log(`✓ Seeded ${brands.length} brands\n`);

  // Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Siemens SIMATIC S7-1200 PLC",
        description: "Compact PLC for small to medium automation",
        price: 485,
        originalPrice: 560,
        category: "Automation",
        brandId: brandMap["Siemens"],
        model: "6ES7214-1AG40-0XB0",
        partNumber: "6ES7214-1AG40-0XB0",
        sku: "SIE-AUT-S71200",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
        rating: 4.9,
        reviewCount: 312,
        stock: 28,
        leadTime: "2–3 days",
        keywords: {
          connectOrCreate: ["plc", "siemens", "automation"].map((word) => ({
            where: { word },
            create: { word },
          })),
        },
        featured: true,
        badge: "Bestseller",
        specs: { CPU: "CPU 1214C", Supply: "24 VDC" },
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "ABB ACS880 VFD 11kW",
        description: "Industrial all-compatible drive",
        price: 1240,
        category: "Drives_Motors",
        brandId: brandMap["ABB"],
        model: "ACS880-01-025A-3",
        partNumber: "ACS880-01-025A-3",
        sku: "ABB-DRI-ACS880",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600",
        rating: 4.8,
        reviewCount: 187,
        stock: 14,
        leadTime: "3–5 days",
        keywords: {
          connectOrCreate: ["vfd", "abb", "drive"].map((word) => ({
            where: { word },
            create: { word },
          })),
        },
        featured: true,
        badge: "New",
        specs: { Power: "11 kW", Voltage: "380-480V" },
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Schneider Masterpact NW 800A",
        description: "Air circuit breaker for LV distribution",
        price: 3280,
        originalPrice: 3900,
        category: "Switchgear",
        brandId: brandMap["Schneider Electric"],
        model: "NW08H1-800A-3P",
        partNumber: "NW08H1-800A-3P",
        sku: "SCH-SWI-NW800",
        image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600",
        rating: 4.9,
        reviewCount: 94,
        stock: 6,
        leadTime: "7–10 days",
        keywords: {
          connectOrCreate: ["mccb", "schneider", "switchgear"].map((word) => ({
            where: { word },
            create: { word },
          })),
        },
        featured: true,
        badge: "Sale",
        specs: { Current: "800A", Poles: "3P" },
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sick S300 Safety Scanner",
        description: "Safety laser scanner for machine guarding",
        price: 2100,
        originalPrice: 2450,
        category: "Safety_Systems",
        brandId: brandMap["SICK"],
        model: "S30A-6011DA",
        partNumber: "S30A-6011DA",
        sku: "SIC-SAF-S300",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600",
        rating: 4.9,
        reviewCount: 128,
        stock: 9,
        leadTime: "5–7 days",
        keywords: {
          connectOrCreate: ["safety", "scanner", "sick"].map((word) => ({
            where: { word },
            create: { word },
          })),
        },
        featured: true,
        badge: "Sale",
        specs: { Range: "3m", Safety: "SIL2" },
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Keyence LR-ZB250CN Sensor",
        description: "Long-range CMOS laser sensor",
        price: 185,
        category: "Sensors_Instrumentation",
        brandId: brandMap["Keyence"],
        model: "LR-ZB250CN",
        partNumber: "LR-ZB250CN",
        sku: "KEY-SEN-LRZ250",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600",
        rating: 4.7,
        reviewCount: 256,
        stock: 67,
        leadTime: "1–2 days",
        keywords: {
          connectOrCreate: ["sensor", "keyence", "photoelectric"].map((word) => ({
            where: { word },
            create: { word },
          })),
        },
        featured: false,
        specs: { Range: "250cm", Output: "NPN/PNP" },
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ Seeded ${products.length} products\n`);

  // Inventory
  await Promise.all(
    products.map((product: { id: string; sku: string; stock: number }) =>
      prisma.inventory.create({
        data: {
          productId: product.id,
          sku: product.sku,
          currentStock: product.stock,
          availableStock: product.stock,
          reorderPoint: 10,
          maxStock: 100,
          status: product.stock > 10 ? "in_stock" : product.stock > 0 ? "low_stock" : "out_of_stock",
        },
      })
    )
  );

  console.log(`✓ Seeded ${products.length} inventory items\n`);

  console.log("✅ Seed complete! Run `npm run dev` to start the server.");

  await app.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
