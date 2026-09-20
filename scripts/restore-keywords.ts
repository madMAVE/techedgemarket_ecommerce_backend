/**
 * Script to restore keyword-product relationships from products.json.
 *
 * Reads the original product data and re-links each product to its
 * individual keywords (split by semicolons/commas).
 *
 * Usage: npx ts-node scripts/restore-keywords.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  // @ts-expect-error family is a valid net.Socket option
  family: 4,
});

// Load products.json
const productsJsonPath = path.resolve(__dirname, "../../frontend/src/data/products.json");
const productsData = JSON.parse(fs.readFileSync(productsJsonPath, "utf-8"));

function extractKeywords(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw.join(";") : raw;
  return str
    .split(/[;,]/)
    .map(w => w.trim())
    .filter(w => w.length > 0 && w !== "[object Object]");
}

async function main() {
  console.log("📖 Loaded products.json with", productsData.length, "products\n");

  let linkedCount = 0;
  let skippedCount = 0;
  let keywordCreatedCount = 0;

  for (const product of productsData) {
    const keywords = extractKeywords(product.keywords);
    if (keywords.length === 0) {
      skippedCount++;
      continue;
    }

    // Find product in DB by name (case-insensitive)
    const dbProduct = await pool.query(
      `SELECT id FROM products WHERE name ILIKE $1 LIMIT 1`,
      [product.name]
    );

    if (dbProduct.rows.length === 0) {
      console.log(`⚠️  Not found in DB: "${product.name}"`);
      skippedCount++;
      continue;
    }

    const productId = dbProduct.rows[0].id;

    for (const word of keywords) {
      // Create keyword if not exists
      const kwResult = await pool.query(
        `INSERT INTO keywords (id, word, score) VALUES (gen_random_uuid()::text, $1, 0)
         ON CONFLICT (word) DO NOTHING RETURNING id`,
        [word]
      );

      if (kwResult.rows.length > 0) {
        keywordCreatedCount++;
      }

      const kwId = kwResult.rows.length > 0
        ? kwResult.rows[0].id
        : (await pool.query(`SELECT id FROM keywords WHERE word = $1`, [word])).rows[0].id;

      // Link product to keyword (ignore if already linked)
      // A = Keyword.id, B = Product.id
      await pool.query(
        `INSERT INTO "_KeywordToProduct" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [kwId, productId]
      );

      linkedCount++;
    }

    console.log(`✓ "${product.name}" → ${keywords.length} keyword(s): [${keywords.join(", ")}]`);
  }

  // ── Summary ─────────────────────────────────────────────────────
  const totalKw = await pool.query(`SELECT COUNT(*) FROM keywords`);
  const prodWithKw = await pool.query(`SELECT COUNT(DISTINCT p.id) FROM products p JOIN "_KeywordToProduct" pk ON p.id = pk."A"`);
  const totalLinks = await pool.query(`SELECT COUNT(*) FROM "_KeywordToProduct"`);

  console.log("\n📊 Summary:");
  console.log(`   Products linked: ${productsData.length - skippedCount}/${productsData.length}`);
  console.log(`   Products skipped: ${skippedCount}`);
  console.log(`   Keyword links created: ${linkedCount}`);
  console.log(`   New keywords created: ${keywordCreatedCount}`);
  console.log(`   Total keywords in DB: ${totalKw.rows[0].count}`);
  console.log(`   Products with keywords: ${prodWithKw.rows[0].count}`);
  console.log(`   Total keyword-product links: ${totalLinks.rows[0].count}`);
  console.log("\n✅ Keyword restoration complete!");
}

main()
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
