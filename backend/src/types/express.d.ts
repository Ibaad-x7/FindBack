import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// This file only augments global types — it must be a module for the
// `declare global` block to work, hence the empty export.
export {};
