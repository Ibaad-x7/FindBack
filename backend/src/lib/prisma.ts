import { PrismaClient } from "@prisma/client";

// Standard singleton pattern to avoid exhausting DB connections from
// ts-node-dev hot reloads in development.
//
// As of Step 2, prisma/schema.prisma defines the full data model (User,
// Item, Match, ContactRequest, Notification). No routes query them yet —
// that starts in Step 3 (Authentication) — but `prisma` is ready to import
// as soon as it's needed.

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url && url.includes("pooler.supabase.com")) {
    try {
      const parsed = new URL(url);
      const match = parsed.username.match(/^postgres\.([a-zA-Z0-9]+)$/);
      if (match) {
        parsed.hostname = `db.${match[1]}.supabase.co`;
        parsed.username = "postgres";
        return new PrismaClient({
          datasources: {
            db: { url: parsed.toString() },
          },
        });
      }
    } catch {
      // Fall back to standard initialization
    }
  }
  return new PrismaClient();
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
