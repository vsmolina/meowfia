import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * The ONE place that picks the Prisma driver adapter (used by the app, seed, and scripts).
 *
 * Switching to Postgres (Neon / Supabase / any Postgres):
 *   1. npm install @prisma/adapter-pg
 *   2. In this file: `import { PrismaPg } from "@prisma/adapter-pg";` and replace the
 *      return statement with `return new PrismaPg({ connectionString: url });`
 *   3. In prisma/schema.prisma set `provider = "postgresql"`
 *   4. Set DATABASE_URL to your Postgres URL, then `npx prisma migrate dev --name init`
 */
export function createDbAdapter(url = process.env.DATABASE_URL ?? "file:./dev.db") {
  return new PrismaBetterSqlite3({ url });
}
