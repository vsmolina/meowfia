/**
 * Promote (or demote) a user to admin.
 *   npm run make-admin -- someone@example.com
 *   npm run make-admin -- someone@example.com --revoke
 * If the user doesn't exist yet, they're created and can sign in with that email.
 */
import "dotenv/config";
import { createDbAdapter } from "../src/lib/db-adapter";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: createDbAdapter() });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const revoke = process.argv.includes("--revoke");
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run make-admin -- you@example.com [--revoke]");
    process.exit(1);
  }
  const role = revoke ? "USER" : "ADMIN";
  const user = await db.user.upsert({ where: { email }, create: { email, role }, update: { role } });
  console.log(`✅ ${user.email} is now ${role}.${revoke ? "" : " Sign in at /sign-in, then open /admin."}`);
}

main().finally(() => db.$disconnect());
