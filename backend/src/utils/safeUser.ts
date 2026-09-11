import { User } from "@prisma/client";

/**
 * The subset of the User model that is safe to send to clients.
 * passwordHash is deliberately never part of this type.
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: User["role"];
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Prisma `select` clause matching SafeUser, for queries that should never
 * even fetch passwordHash from the database in the first place. */
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;
