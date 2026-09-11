import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";

/**
 * GET /api/notifications
 * Retrieves caller's notifications with pagination and unread counts.
 * Requires requireAuth.
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { unreadOnly } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where: Prisma.NotificationWhereInput = {
      userId: req.user.id,
      ...(unreadOnly === "true" ? { read: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.id, read: false },
      }),
    ]);

    return sendSuccess(res, "Notifications fetched successfully.", {
      notifications,
      unreadCount,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    return handleNotificationError(res, err, "Could not fetch notifications.");
  }
}

/**
 * GET /api/notifications/unread-count
 * Fast endpoint to fetch only the unread count for navbar badges.
 * Requires requireAuth.
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });

    return sendSuccess(res, "Unread notification count fetched successfully.", {
      unreadCount,
    });
  } catch (err) {
    return handleNotificationError(res, err, "Could not fetch unread count.");
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 * Requires requireAuth.
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return sendError(res, "Notification not found.", 404);
    }

    // Security check: only owner or ADMIN can modify
    if (notification.userId !== req.user.id && req.user.role !== "ADMIN") {
      return sendError(
        res,
        "You do not have permission to modify this notification.",
        403
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return sendSuccess(res, "Notification marked as read.", {
      notification: updated,
    });
  } catch (err) {
    return handleNotificationError(res, err, "Could not update notification.");
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all of the caller's notifications as read.
 * Requires requireAuth.
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    return sendSuccess(res, "All notifications marked as read.", {
      markedCount: result.count,
    });
  } catch (err) {
    return handleNotificationError(res, err, "Could not mark all as read.");
  }
}

/**
 * DELETE /api/notifications/:id
 * Deletes a notification.
 * Requires requireAuth.
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return sendError(res, "Notification not found.", 404);
    }

    // Security check: only owner or ADMIN can delete
    if (notification.userId !== req.user.id && req.user.role !== "ADMIN") {
      return sendError(
        res,
        "You do not have permission to delete this notification.",
        403
      );
    }

    await prisma.notification.delete({ where: { id } });

    return sendSuccess(res, "Notification deleted successfully.");
  } catch (err) {
    return handleNotificationError(res, err, "Could not delete notification.");
  }
}

function handleNotificationError(
  res: Response,
  err: unknown,
  fallbackMessage: string
) {
  console.error("Notification error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return sendError(res, "Notification not found.", 404);
    }
  }

  return sendError(res, fallbackMessage, 500);
}

