import { Request, Response } from "express";
import { Prisma, Role, ItemStatus, ContactRequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signAuthToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/apiResponse";
import {
  validateRegisterInput,
  validateLoginInput,
  validateProfileUpdateInput,
  validateChangePasswordInput,
} from "../utils/validators";
import { toSafeUser, SAFE_USER_SELECT } from "../utils/safeUser";
import { deleteUploadedFile } from "../utils/fileUtils";
import { env } from "../config/env";

/**
 * Guards register/login from doing any work (hashing, DB writes) when
 * JWT_SECRET isn't configured, since neither endpoint can succeed without
 * being able to sign a token afterwards. Checked up front so we never end
 * up creating a user record we then fail to hand a token back for.
 */
function ensureJwtConfigured(res: Response): boolean {
  if (!env.jwtSecret) {
    sendError(
      res,
      "Authentication is not configured correctly. Please contact the administrator.",
      500
    );
    return false;
  }
  return true;
}

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response) {
  try {
    if (!ensureJwtConfigured(res)) return;

    const { name, email, password } = req.body ?? {};

    const validationErrors = validateRegisterInput({ name, email, password });
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return sendError(res, "An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(password as string);

    const user = await prisma.user.create({
      data: {
        name: (name as string).trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.USER,
      },
    });

    const token = signAuthToken({ userId: user.id, role: user.role });

    return sendSuccess(
      res,
      "Registration successful.",
      { user: toSafeUser(user), token },
      201
    );
  } catch (err) {
    return handleAuthError(res, err, "Registration failed. Please try again later.");
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  try {
    if (!ensureJwtConfigured(res)) return;

    const { email, password } = req.body ?? {};

    const validationErrors = validateLoginInput({ email, password });
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Deliberately identical error for "no such user" and "wrong password"
    // so the response never reveals whether an email is registered.
    if (!user) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const passwordMatches = await comparePassword(
      password as string,
      user.passwordHash
    );
    if (!passwordMatches) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const token = signAuthToken({ userId: user.id, role: user.role });

    return sendSuccess(res, "Login successful.", {
      user: toSafeUser(user),
      token,
    });
  } catch (err) {
    return handleAuthError(res, err, "Login failed. Please try again later.");
  }
}

/**
 * GET /api/auth/me
 * Requires requireAuth to have run first (req.user is set).
 */
export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      // Token was valid but the account no longer exists.
      return sendError(res, "User account not found.", 404);
    }

    return sendSuccess(res, "User fetched successfully.", { user });
  } catch (err) {
    return handleAuthError(res, err, "Could not load user. Please try again later.");
  }
}

/**
 * PUT /api/auth/profile
 * Requires requireAuth.
 * Updates user profile details (name, phone, profileImage).
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { name, phone, profileImage } = req.body ?? {};

    const validationErrors = validateProfileUpdateInput({ name, phone, profileImage });
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profileImage: true },
    });

    if (!currentUser) {
      return sendError(res, "User account not found.", 404);
    }

    const data: Prisma.UserUpdateInput = {};

    if (name !== undefined) {
      data.name = (name as string).trim();
    }

    if (phone !== undefined) {
      data.phone = phone && typeof phone === "string" && phone.trim().length > 0
        ? phone.trim()
        : null;
    }

    if (profileImage !== undefined) {
      const newProfileImage = profileImage && typeof profileImage === "string" && profileImage.trim().length > 0
        ? profileImage.trim()
        : null;

      // Clean up previous uploaded image if replaced or removed
      if (
        currentUser.profileImage &&
        currentUser.profileImage !== newProfileImage &&
        currentUser.profileImage.startsWith("/uploads/")
      ) {
        await deleteUploadedFile(currentUser.profileImage);
      }

      data.profileImage = newProfileImage;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: SAFE_USER_SELECT,
    });

    return sendSuccess(res, "Profile updated successfully.", { user: updatedUser });
  } catch (err) {
    return handleAuthError(res, err, "Could not update profile. Please try again later.");
  }
}

/**
 * PUT /api/auth/password
 * Requires requireAuth.
 * Changes the user's password after verifying the current password.
 */
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { currentPassword, newPassword } = req.body ?? {};

    const validationErrors = validateChangePasswordInput({ currentPassword, newPassword });
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return sendError(res, "User account not found.", 404);
    }

    const isCurrentPasswordCorrect = await comparePassword(
      currentPassword as string,
      user.passwordHash
    );

    if (!isCurrentPasswordCorrect) {
      return sendError(res, "Current password is incorrect.", 400);
    }

    const newPasswordHash = await hashPassword(newPassword as string);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return sendSuccess(res, "Password changed successfully.");
  } catch (err) {
    return handleAuthError(res, err, "Could not change password. Please try again later.");
  }
}

/**
 * GET /api/auth/stats
 * Requires requireAuth.
 * Returns personal activity statistics for the authenticated user.
 */
export async function getUserStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const userId = req.user.id;

    const [
      totalItems,
      activeItems,
      recoveredItems,
      receivedRequests,
      pendingRequests,
      unreadNotifications,
    ] = await Promise.all([
      prisma.item.count({ where: { userId } }),
      prisma.item.count({ where: { userId, status: ItemStatus.ACTIVE } }),
      prisma.item.count({
        where: {
          userId,
          status: ItemStatus.RECOVERED,
        },
      }),
      prisma.contactRequest.count({ where: { receiverId: userId } }),
      prisma.contactRequest.count({
        where: { receiverId: userId, status: ContactRequestStatus.PENDING },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return sendSuccess(res, "User statistics fetched successfully.", {
      stats: {
        totalItems,
        activeItems,
        recoveredItems,
        receivedRequests,
        pendingRequests,
        unreadNotifications,
      },
    });
  } catch (err) {
    return handleAuthError(res, err, "Could not fetch user statistics. Please try again later.");
  }
}

/**
 * Central error handler for auth controllers: logs the real error
 * server-side but never leaks database/internal details to the client.
 */
function handleAuthError(res: Response, err: unknown, fallbackMessage: string) {
  console.error("Auth error:", err);

  // A missing JWT_SECRET surfaces here as a thrown Error from utils/jwt.ts.
  if (err instanceof Error && err.message.includes("JWT_SECRET")) {
    return sendError(
      res,
      "Authentication is not configured correctly. Please contact the administrator.",
      500
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // e.g. unique constraint race condition on email
    if (err.code === "P2002") {
      return sendError(res, "An account with this email already exists.", 409);
    }
  }

  return sendError(res, fallbackMessage, 500);
}
