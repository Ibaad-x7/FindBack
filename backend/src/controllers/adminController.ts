import { Request, Response } from "express";
import {
  Prisma,
  Role,
  ItemType,
  ItemStatus,
  ItemCategory,
  MatchStatus,
  ContactRequestStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { SAFE_USER_SELECT } from "../utils/safeUser";
import { deleteUploadedFile } from "../utils/fileUtils";

/**
 * GET /api/admin/stats
 * Returns platform-wide KPIs for the admin dashboard.
 *
 * CRITICAL RULE: recoveredItems strictly counts ItemStatus.RECOVERED only.
 * MATCHED items are counted separately under matchedItems.
 */
export async function getStats(_req: Request, res: Response) {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalItems,
      lostItems,
      foundItems,
      activeItems,
      matchedItems,
      recoveredItems,
      closedItems,
      pendingContactRequests,
      totalContactRequests,
      totalMatches,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.item.count(),
      prisma.item.count({ where: { type: ItemType.LOST } }),
      prisma.item.count({ where: { type: ItemType.FOUND } }),
      prisma.item.count({ where: { status: ItemStatus.ACTIVE } }),
      prisma.item.count({ where: { status: ItemStatus.MATCHED } }),
      prisma.item.count({ where: { status: ItemStatus.RECOVERED } }), // Strictly RECOVERED only
      prisma.item.count({ where: { status: ItemStatus.CLOSED } }),
      prisma.contactRequest.count({
        where: { status: ContactRequestStatus.PENDING },
      }),
      prisma.contactRequest.count(),
      prisma.match.count(),
    ]);

    return sendSuccess(res, "Admin statistics fetched successfully.", {
      stats: {
        totalUsers,
        totalAdmins,
        totalItems,
        lostItems,
        foundItems,
        activeItems,
        matchedItems,
        recoveredItems,
        closedItems,
        pendingContactRequests,
        totalContactRequests,
        totalMatches,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return sendError(res, "Could not fetch admin statistics. Please try again later.", 500);
  }
}

/**
 * GET /api/admin/users
 * Returns a paginated list of registered users with item counts.
 * Excludes passwordHash.
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, role } = req.query;

    const where: Prisma.UserWhereInput = {};

    if (typeof search === "string" && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    if (role === Role.USER || role === Role.ADMIN) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...SAFE_USER_SELECT,
          _count: {
            select: {
              items: true,
              receivedContactRequests: true,
              sentContactRequests: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, "Users fetched successfully.", {
      users,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    console.error("Admin get users error:", err);
    return sendError(res, "Could not fetch users. Please try again later.", 500);
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Allows an ADMIN to promote or demote a user's role (USER <-> ADMIN).
 * Prevents an admin from demoting themselves.
 */
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (!id || typeof id !== "string") {
      return sendError(res, "Invalid user ID provided.", 400);
    }

    if (role !== Role.USER && role !== Role.ADMIN) {
      return sendError(res, "Invalid role. Must be 'USER' or 'ADMIN'.", 400);
    }

    // Safeguard: An admin cannot demote their own account
    if (req.user?.id === id) {
      return sendError(res, "You cannot modify your own administrative role.", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return sendError(res, "User account not found.", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: SAFE_USER_SELECT,
    });

    return sendSuccess(res, "User role updated successfully.", { user: updatedUser });
  } catch (err) {
    console.error("Admin update user role error:", err);
    return sendError(res, "Could not update user role. Please try again later.", 500);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Deletes a user account and associated disk images.
 * Prevents an admin from deleting their own account.
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return sendError(res, "Invalid user ID provided.", 400);
    }

    // Safeguard: An admin cannot delete their own account
    if (req.user?.id === id) {
      return sendError(res, "You cannot delete your own account from the admin dashboard.", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, profileImage: true },
    });

    if (!targetUser) {
      return sendError(res, "User account not found.", 404);
    }

    // Collect all item image URLs before deleting the user
    const userItems = await prisma.item.findMany({
      where: { userId: id },
      select: { imageUrl: true },
    });

    for (const item of userItems) {
      if (item.imageUrl) {
        await deleteUploadedFile(item.imageUrl);
      }
    }

    if (targetUser.profileImage) {
      await deleteUploadedFile(targetUser.profileImage);
    }

    // Delete user from DB (Prisma cascade deletes items, contact requests, notifications, matches)
    await prisma.user.delete({ where: { id } });

    return sendSuccess(res, "User and associated resources deleted successfully.");
  } catch (err) {
    console.error("Admin delete user error:", err);
    return sendError(res, "Could not delete user. Please try again later.", 500);
  }
}

/**
 * GET /api/admin/items
 * Returns a paginated list of all items across all statuses (including CLOSED),
 * with owner information and contact request counts for moderation.
 */
export async function getAdminItems(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, type, status, category } = req.query;

    const where: Prisma.ItemWhereInput = {};

    if (typeof search === "string" && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
      ];
    }

    if (type === ItemType.LOST || type === ItemType.FOUND) {
      where.type = type;
    }

    if (
      status === ItemStatus.ACTIVE ||
      status === ItemStatus.MATCHED ||
      status === ItemStatus.RECOVERED ||
      status === ItemStatus.CLOSED
    ) {
      where.status = status;
    }

    if (typeof category === "string" && category in ItemCategory) {
      where.category = category as ItemCategory;
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          user: { select: SAFE_USER_SELECT },
          _count: {
            select: {
              contactRequests: true,
              matchesAsLostItem: true,
              matchesAsFoundItem: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    const formattedItems = items.map((item) => {
      const { user, _count, ...rest } = item;
      return {
        ...rest,
        owner: user,
        contactRequestsCount: _count.contactRequests,
        matchesCount: _count.matchesAsLostItem + _count.matchesAsFoundItem,
      };
    });

    return sendSuccess(res, "Admin items fetched successfully.", {
      items: formattedItems,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    console.error("Admin get items error:", err);
    return sendError(res, "Could not fetch items. Please try again later.", 500);
  }
}

