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

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

