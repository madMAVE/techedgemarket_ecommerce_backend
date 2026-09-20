/**
 * Restore keywords for products that currently have none.
 * Matches products by partNumber (most reliable identifier).
 *
 * Usage: npx ts-node scripts/restore-missing-keywords.ts
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

  // Get all products from DB with their partNumbers
  const dbProducts = await pool.query(`SELECT id, name, "partNumber" FROM products`);
  const dbMap = new Map<string, { id: string; name: string }>();
  for (const row of dbProducts.rows) {
    if (row.partNumber) dbMap.set(row.partNumber, { id: row.id, name: row.name });
  }

  let restoredCount = 0;
  let skippedCount = 0;
  let alreadyHasCount = 0;
  let keywordCreatedCount = 0;

  for (const product of productsData) {
    const keywords = extractKeywords(product.keywords);
    if (keywords.length === 0) {
      skippedCount++;
      continue;
    }

    // Match by partNumber first
    let dbProduct = dbMap.get(product.partNumber);

    // Fallback: match by name (case-insensitive)
    if (!dbProduct) {
      const nameMatch = await pool.query(
        `SELECT id, name FROM products WHERE name ILIKE $1 LIMIT 1`,
        [product.name]
      );
      if (nameMatch.rows.length > 0) {
        dbProduct = { id: nameMatch.rows[0].id, name: nameMatch.rows[0].name };
      }
    }

    if (!dbProduct) {
      console.log(`⚠️  Not found: "${product.name}" (partNumber: ${product.partNumber})`);
      skippedCount++;
      continue;
    }

    // Check if product already has keywords
    const existingKw = await pool.query(
      `SELECT COUNT(*) FROM "_KeywordToProduct" WHERE "B" = $1`,
      [dbProduct.id]
    );

    if (parseInt(existingKw.rows[0].count) > 0) {
      alreadyHasCount++;
      continue;
    }

    // Link keywords
    for (const word of keywords) {
      // Create keyword if not exists
      const kwResult = await pool.query(
        `INSERT INTO keywords (id, word, score) VALUES (gen_random_uuid()::text, $1, 0)
         ON CONFLICT (word) DO NOTHING RETURNING id`,
        [word]
      );

      if (kwResult.rows.length > 0) keywordCreatedCount++;

      const kwId = kwResult.rows.length > 0
        ? kwResult.rows[0].id
        : (await pool.query(`SELECT id FROM keywords WHERE word = $1`, [word])).rows[0].id;

      // Link: A = keyword_id, B = product_id
      await pool.query(
        `INSERT INTO "_KeywordToProduct" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [kwId, dbProduct.id]
      );

      restoredCount++;
    }

    console.log(`✓ "${dbProduct.name}" → ${keywords.length} keyword(s)`);
  }

  // ── Summary ─────────────────────────────────────────────────────
  const totalKw = await pool.query(`SELECT COUNT(*) FROM keywords`);
  const prodWithKw = await pool.query(`SELECT COUNT(DISTINCT "B") FROM "_KeywordToProduct"`);
  const totalLinks = await pool.query(`SELECT COUNT(*) FROM "_KeywordToProduct"`);

  console.log("\n📊 Summary:");
  console.log(`   Products with keywords restored: ${restoredCount}`);
  console.log(`   Products already had keywords: ${alreadyHasCount}`);
  console.log(`   Products skipped (not in DB): ${skippedCount}`);
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
