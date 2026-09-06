# Problem: Product Image Updates Not Persisting

## Summary
When uploading images to a product, the `UPDATE` query appears to succeed (all verifications show new data within the same request), but subsequent reads from a different request return the old data. The data appears to revert between requests.

## Database
- **Provider**: Supabase PostgreSQL
- **Connection**: `postgresql://postgres:***@db.pgwkoepprueppoajrrug.supabase.co:5432/postgres` (direct connection)
- **Table**: `products`
- **Columns**: `image TEXT`, `images TEXT[]`

## The Issue

### Upload Flow (within same request)
1. Image uploads to Supabase Storage ✅ (returns valid URL)
2. Raw SQL `UPDATE products SET image = ..., images = ...::text[] WHERE id = ...` executes ✅
3. `BEGIN` + `COMMIT` explicit transaction ✅
4. Verify inside transaction → new data ✅
5. Verify after commit (same connection) → new data ✅
6. Prisma `findUnique` right after → new data ✅
7. Pool query right after → new data ✅

### But Next Request (findAll)
8. Same pool, same connection string → **OLD data** ❌
9. `prisma.$queryRaw` → **OLD data** ❌
10. Direct `pg` pool query → **OLD data** ❌

### Server Restart
- On startup, `onModuleInit` reads old data ❌
- Data never persists across requests

## Things Tried (all failed)
1. **Prisma `push` on `images TEXT[]`** — returned new data but didn't persist
2. **Raw SQL `UPDATE` via Prisma `$executeRaw`** — same behavior
3. **Raw SQL `UPDATE` via separate `pg.Pool`** — same behavior
4. **Explicit `BEGIN`/`COMMIT` transaction** — same behavior
5. **Switched from pgBouncer pooler to direct connection** — same behavior
6. **Shared single `pg.Pool` for all queries** — same behavior
7. **Supabase Storage bucket made public** — fixed 404 on images, not data issue

## Key Observations
- **No errors** — all queries return successfully
- **Same DATABASE_URL** used everywhere
- **No seed script** running on startup
- **No middleware/interceptor** modifying data
- **No `$transaction` usage** in codebase
- **No manual `pool.connect()`** without release
- **No database triggers** found (checked `information_schema.triggers`)
- **Response interceptor** only wraps in `{ success, message, data }` — doesn't modify data

## Stack
- Node.js / NestJS
- Prisma v7.9.1 with `@prisma/adapter-pg` v7.9.1
- `pg` driver
- Supabase PostgreSQL (direct connection, port 5432)
- Supabase Storage for file hosting

## Hypotheses
1. **Supabase read replica** — writes go to primary, reads hit stale replica
2. **Database trigger** reverting changes (ruled out via `information_schema.triggers` check — pending confirmation)
3. **Prisma v7 + adapter-pg bug** with autocommit/transaction isolation
4. **Supabase connection pooler** routing to different backend (even on direct connection?)
5. **Something else overwriting the data** — another process, cron, or edge function

## Next Steps
- Run `SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction'` after upload to check for lingering uncommitted transactions
- Run `SELECT * FROM products WHERE id = 'e57cc003-e0eb-456f-8289-16348df656c3'` in Supabase SQL Editor to see what's actually in the DB
- Check Supabase Dashboard → Database → Triggers for any hidden triggers
- Check if any Supabase Edge Functions or cron jobs modify the products table
