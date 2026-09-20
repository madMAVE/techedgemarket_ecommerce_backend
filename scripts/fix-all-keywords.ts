/**
 * One-shot script to fix all keyword issues.
 *
 * 1. Delete [object Object] junk keywords
 * 2. Split semicolon-separated keywords into individual entries
 * 3. Re-link products to their individual keywords
 *
 * Usage: npx ts-node scripts/fix-all-keywords.ts
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
  console.log("🔍 Starting keyword cleanup...\n");

  // ── 1. Delete [object Object] junk keywords ──────────────────────
  const junkResult = await pool.query(`
    SELECT k.id, k.word, COUNT(kp."B") as product_count
    FROM keywords k
    LEFT JOIN "_KeywordToProduct" kp ON k.id = kp."A"
    WHERE k.word = '[object Object]'
    GROUP BY k.id
  `);

  if (junkResult.rows.length > 0) {
    console.log(`🗑 Found ${junkResult.rows.length} junk keyword(s):`);
    for (const row of junkResult.rows) {
      console.log(`   - "${row.word}" (linked to ${row.product_count} products)`);
    }
    await pool.query(`DELETE FROM keywords WHERE word = '[object Object]'`);
    console.log(`   ✓ Deleted\n`);
  } else {
    console.log("✅ No junk keywords\n");
  }

  // ── 2. Split semicolon-separated keywords ────────────────────────
  const compoundResult = await pool.query(`
    SELECT k.id, k.word, COUNT(kp."B") as product_count
    FROM keywords k
    LEFT JOIN "_KeywordToProduct" kp ON k.id = kp."A"
    WHERE k.word LIKE '%;%'
    GROUP BY k.id
  `);

  if (compoundResult.rows.length === 0) {
    console.log("✅ No compound keywords to split\n");
  } else {
    console.log(`✂️ Found ${compoundResult.rows.length} compound keyword(s):\n`);

    let totalNew = 0;
    let totalDeleted = 0;

    for (const row of compoundResult.rows) {
      const words = row.word.split(";").map((w: string) => w.trim()).filter(Boolean);
      console.log(`   "${row.word}" → [${words.join(", ")}]`);

      // Get product IDs linked to this compound keyword (B = product_id)
      const productRows = await pool.query(
        `SELECT "B" as product_id FROM "_KeywordToProduct" WHERE "A" = $1`,
        [row.id]
      );
      const productIds = productRows.rows.map((r: any) => r.product_id);
      console.log(`   → Linked to ${productIds.length} product(s)`);

      // For each word, create keyword if not exists and link to products
      for (const word of words) {
        // Create keyword if not exists
        const kwResult = await pool.query(
          `INSERT INTO keywords (id, word, score) VALUES (gen_random_uuid()::text, $1, 0)
           ON CONFLICT (word) DO NOTHING RETURNING id`,
          [word]
        );

        const kwId = kwResult.rows.length > 0
          ? kwResult.rows[0].id
          : (await pool.query(`SELECT id FROM keywords WHERE word = $1`, [word])).rows[0].id;

        // Link to all products (A = keyword_id, B = product_id)
        if (productIds.length > 0) {
          const values = productIds
            .map((pid: string, i: number) => `($${i * 2 + 1}, $${i * 2 + 2})`)
            .join(", ");
          const params = productIds.flatMap((pid: string) => [kwId, pid]);

          await pool.query(
            `INSERT INTO "_KeywordToProduct" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
            params
          );
        }

        totalNew++;
      }

      // Delete the compound keyword (cascade removes join table entries)
      await pool.query(`DELETE FROM keywords WHERE id = $1`, [row.id]);
      totalDeleted++;
      console.log(`   ✓ Done\n`);
    }

    console.log(`   Summary: ${totalNew} new keywords created, ${totalDeleted} compound deleted\n`);
  }

  // ── 3. Final summary ─────────────────────────────────────────────
  const totalKw = await pool.query(`SELECT COUNT(*) FROM keywords`);
  const prodWithKw = await pool.query(`SELECT COUNT(DISTINCT kp."B") FROM "_KeywordToProduct" kp`);
  const totalLinks = await pool.query(`SELECT COUNT(*) FROM "_KeywordToProduct"`);

  console.log("📊 Database summary:");
  console.log(`   Total keywords: ${totalKw.rows[0].count}`);
  console.log(`   Products with keywords: ${prodWithKw.rows[0].count}`);
  console.log(`   Total keyword-product links: ${totalLinks.rows[0].count}`);
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
