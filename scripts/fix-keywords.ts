/**
 * Script to fix corrupted keyword entries in the database.
 *
 * Problems fixed:
 * 1. Keywords with word = "[object Object]" — deleted (junk data)
 * 2. Keywords with semicolon-separated words like "plc; siemens; automation"
 *    — split into individual keyword entries and re-linked to products
 *
 * Usage: npx ts-node scripts/fix-keywords.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  // @ts-expect-error family is a valid net.Socket option
  family: 4,
});

async function main() {
  console.log("🔍 Scanning keywords for issues...\n");

  // ── 1. Find and delete "[object Object]" keywords ──────────────────
  const junkResult = await pool.query(`
    SELECT k.id, k.word, COUNT(pk."A") as product_count
    FROM keywords k
    LEFT JOIN "_KeywordToProduct" pk ON k.id = pk."B"
    WHERE k.word = '[object Object]'
    GROUP BY k.id
  `);

  if (junkResult.rows.length > 0) {
    console.log(`🗑 Found ${junkResult.rows.length} junk keyword(s) with word="[object Object]":`);
    for (const row of junkResult.rows) {
      console.log(`   - ID: ${row.id} | Linked to ${row.product_count} product(s)`);
    }

    // Delete junk keywords (cascade handles the join table)
    await pool.query(`DELETE FROM keywords WHERE word = '[object Object]'`);
    console.log(`   ✓ Deleted ${junkResult.rows.length} junk keyword(s)\n`);
  } else {
    console.log("✅ No junk keywords found\n");
  }

  // ── 2. Find and split semicolon-separated keywords ─────────────────
  const compoundResult = await pool.query(`
    SELECT k.id, k.word, COUNT(pk."A") as product_count
    FROM keywords k
    LEFT JOIN "_KeywordToProduct" pk ON k.id = pk."B"
    WHERE k.word LIKE '%;%'
    GROUP BY k.id
  `);

  if (compoundResult.rows.length > 0) {
    console.log(`✂️ Found ${compoundResult.rows.length} compound keyword(s) containing semicolons:\n`);

    let splitCount = 0;
    let deleteCount = 0;

    for (const row of compoundResult.rows) {
      const words = row.word.split(";").map((w: string) => w.trim()).filter(Boolean);
      console.log(`   Splitting: "${row.word}"`);
      console.log(`   → ${words.length} individual keyword(s): [${words.join(", ")}]`);
      console.log(`   → Linked to ${row.product_count} product(s)`);

      // Get product IDs linked to this compound keyword
      const productRows = await pool.query(
        `SELECT "B" as product_id FROM "_KeywordToProduct" WHERE "A" = $1`,
        [row.id]
      );

      const productIds = productRows.rows.map((r: any) => r.product_id);

      // For each word, create keyword if not exists and link to all products
      for (const word of words) {
        // Create keyword if it doesn't exist
        const kwResult = await pool.query(
          `INSERT INTO keywords (id, word, score) VALUES (gen_random_uuid()::text, $1, 0)
           ON CONFLICT (word) DO NOTHING RETURNING id`,
          [word]
        );

        const kwId = kwResult.rows.length > 0
          ? kwResult.rows[0].id
          : (await pool.query(`SELECT id FROM keywords WHERE word = $1`, [word])).rows[0].id;

        // Link to all products (ignore if already linked)
        if (productIds.length > 0) {
          const values = productIds
            .map((pid: string, i: number) => `($${i * 2 + 1}, $${i * 2 + 2})`)
            .join(", ");
          const params = productIds.flatMap((pid: string) => [kwId, pid]);

          await pool.query(
            `INSERT INTO "_KeywordToProduct" ("A", "B") VALUES ${values}
             ON CONFLICT DO NOTHING`,
            params
          );
        }

        splitCount++;
      }

      // Delete the compound keyword
      await pool.query(`DELETE FROM keywords WHERE id = $1`, [row.id]);
      deleteCount++;
      console.log(`   ✓ Split into ${words.length} keywords, deleted compound\n`);
    }

    console.log(`   ✓ Processed: ${splitCount} new keywords created, ${deleteCount} compound keywords deleted\n`);
  } else {
    console.log("✅ No compound keywords found\n");
  }

  // ── 3. Summary ─────────────────────────────────────────────────────
  const totalKw = await pool.query(`SELECT COUNT(*) FROM keywords`);
  const totalProd = await pool.query(`SELECT COUNT(*) FROM products`);
  const prodWithKw = await pool.query(`SELECT COUNT(DISTINCT p.id) FROM products p JOIN "_KeywordToProduct" pk ON p.id = pk."A"`);

  console.log("📊 Database summary:");
  console.log(`   Total keywords: ${totalKw.rows[0].count}`);
  console.log(`   Total products: ${totalProd.rows[0].count}`);
  console.log(`   Products with keywords: ${prodWithKw.rows[0].count}`);
  console.log("\n✅ Keyword cleanup complete!");
}

main()
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
