import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { createDbAdapter } from "@/lib/db-adapter";

/** Prisma client singleton. To switch databases, see src/lib/db-adapter.ts. */
function createClient() {
  return new PrismaClient({ adapter: createDbAdapter() });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export * from "@/generated/prisma/client";
