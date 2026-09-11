import { Request, Response } from "express";
import { Prisma, ItemType, ItemStatus, ItemCategory } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { SAFE_USER_SELECT } from "../utils/safeUser";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import {
  validateCreateItemInput,
  validateUpdateItemInput,
  validateStatusUpdateInput,
  isValidItemType,
  isValidItemCategory,
  isValidItemStatus,
  UPDATABLE_ITEM_FIELDS,
} from "../utils/itemValidators";
import { deleteUploadedFile } from "../utils/fileUtils";

/** Shapes a Prisma Item (with an included `user`) into the API response
 * form: the relation is renamed to `owner`, and passwordHash never leaves
 * lib/prisma.ts in the first place since we always `select` a safe subset
 * of the user's fields when including it. */
function toItemResponse<
  T extends { user?: unknown; [key: string]: unknown }
>(item: T) {
  const { user, ...rest } = item;
  return user !== undefined ? { ...rest, owner: user } : rest;
}

const ITEM_INCLUDE_OWNER = {
  user: { select: SAFE_USER_SELECT },
} as const;

/**
 * POST /api/items
 * Requires requireAuth (req.user is set).
 */
export async function createItem(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const {
      type,
      name,
      category,
      description,
      location,
      city,
      date,
      additionalDetails,
      identifyingCharacteristics,
      imageUrl,
      // userId is intentionally destructured and discarded here — even if
      // a client sends one, it is never read again below.
    } = req.body ?? {};

    const validationErrors = validateCreateItemInput({
      type,
      name,
      category,
      description,
      location,
      city,
      date,
      additionalDetails,
      identifyingCharacteristics,
      imageUrl,
    });
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const item = await prisma.item.create({
      data: {
        userId: req.user.id, // always the authenticated user — never client-supplied
        type,
        name: (name as string).trim(),
        category,
        description: (description as string).trim(),
        location: (location as string).trim(),
        city: (city as string).trim(),
        date: new Date(date as string),
        additionalDetails: additionalDetails ?? null,
        identifyingCharacteristics: identifyingCharacteristics ?? null,
        imageUrl: imageUrl ?? null,
        status: ItemStatus.ACTIVE,
      },
      include: ITEM_INCLUDE_OWNER,
    });

    return sendSuccess(
      res,
      "Item created successfully.",
      { item: toItemResponse(item) },
      201
    );
  } catch (err) {
    return handleItemError(res, err, "Could not create item. Please try again later.");
  }
}

/**
 * GET /api/items
 * Public. Defaults to ACTIVE items unless ?status= overrides it.
 */
export async function getItems(req: Request, res: Response) {
  try {
    const { type, category, city, status, search } = req.query;

    if (type !== undefined && !isValidItemType(type)) {
      return sendError(res, `type must be one of: ${Object.values(ItemType).join(", ")}.`, 400);
    }
    if (category !== undefined && !isValidItemCategory(category)) {
      return sendError(res, "Invalid category filter.", 400);
    }
    if (status !== undefined && !isValidItemStatus(status)) {
      return sendError(res, "Invalid status filter.", 400);
    }

    const { page, limit, skip } = parsePagination(req.query);

    const where: Prisma.ItemWhereInput = {
      status: status !== undefined ? (status as ItemStatus) : ItemStatus.ACTIVE,
    };

    if (type !== undefined) {
      where.type = type as ItemType;
    }
    if (category !== undefined) {
      where.category = category as ItemCategory;
    }
    if (typeof city === "string" && city.trim().length > 0) {
      where.city = { equals: city.trim(), mode: "insensitive" };
    }
    if (typeof search === "string" && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { additionalDetails: { contains: term, mode: "insensitive" } },
        { identifyingCharacteristics: { contains: term, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: ITEM_INCLUDE_OWNER,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    return sendSuccess(res, "Items fetched successfully.", {
      items: items.map(toItemResponse),
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    return handleItemError(res, err, "Could not fetch items. Please try again later.");
  }
}

/**
 * GET /api/items/my
 * Requires requireAuth. Returns the authenticated user's own items,
 * regardless of status by default (it's their own dashboard).
 */
export async function getMyItems(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { type, status } = req.query;

    if (type !== undefined && !isValidItemType(type)) {
      return sendError(res, `type must be one of: ${Object.values(ItemType).join(", ")}.`, 400);
    }
    if (status !== undefined && !isValidItemStatus(status)) {
      return sendError(res, "Invalid status filter.", 400);
    }

    const { page, limit, skip } = parsePagination(req.query);

    const where: Prisma.ItemWhereInput = {
      userId: req.user.id,
      ...(type !== undefined ? { type: type as ItemType } : {}),
      ...(status !== undefined ? { status: status as ItemStatus } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: ITEM_INCLUDE_OWNER,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    return sendSuccess(res, "Your items fetched successfully.", {
      items: items.map(toItemResponse),
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    return handleItemError(res, err, "Could not fetch your items. Please try again later.");
  }
}

/**
 * GET /api/items/:id
 * Public.
 */
export async function getItemById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: ITEM_INCLUDE_OWNER,
    });

    if (!item) {
      return sendError(res, "Item not found.", 404);
    }

    return sendSuccess(res, "Item fetched successfully.", {
      item: toItemResponse(item),
    });
  } catch (err) {
    return handleItemError(res, err, "Could not fetch item. Please try again later.");
  }
}

/**
 * PUT /api/items/:id
 * Requires requireAuth. Owner or ADMIN only.
 */
export async function updateItem(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;

    const existingItem = await prisma.item.findUnique({ where: { id } });
    if (!existingItem) {
      return sendError(res, "Item not found.", 404);
    }

    if (existingItem.userId !== req.user.id && req.user.role !== "ADMIN") {
      return sendError(res, "You do not have permission to update this item.", 403);
    }

    const body = req.body ?? {};
    const validationErrors = validateUpdateItemInput(body);
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    // Only ever pull whitelisted fields out of the body — userId, id,
    // createdAt, updatedAt, etc. are never applied even if present.
    const data: Prisma.ItemUpdateInput = {};
    for (const field of UPDATABLE_ITEM_FIELDS) {
      if (field in body) {
        if (field === "date") {
          data.date = new Date(body.date as string);
        } else {
          (data as Record<string, unknown>)[field] = body[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return sendError(res, "No valid fields provided to update.", 400);
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data,
      include: ITEM_INCLUDE_OWNER,
    });

    // Clean up previous uploaded image if replaced or removed
    if (
      "imageUrl" in body &&
      existingItem.imageUrl &&
      existingItem.imageUrl !== updatedItem.imageUrl &&
      existingItem.imageUrl.startsWith("/uploads/")
    ) {
      await deleteUploadedFile(existingItem.imageUrl);
    }

    return sendSuccess(res, "Item updated successfully.", {
      item: toItemResponse(updatedItem),
    });
  } catch (err) {
    return handleItemError(res, err, "Could not update item. Please try again later.");
  }
}

/**
 * PATCH /api/items/:id/status
 * Requires requireAuth. Owner or ADMIN only.
 */
export async function updateItemStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;

    const existingItem = await prisma.item.findUnique({ where: { id } });
    if (!existingItem) {
      return sendError(res, "Item not found.", 404);
    }

    if (existingItem.userId !== req.user.id && req.user.role !== "ADMIN") {
      return sendError(res, "You do not have permission to update this item.", 403);
    }

    const validationErrors = validateStatusUpdateInput(req.body ?? {});
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: { status: req.body.status as ItemStatus },
      include: ITEM_INCLUDE_OWNER,
    });

    return sendSuccess(res, "Item status updated successfully.", {
      item: toItemResponse(updatedItem),
    });
  } catch (err) {
    return handleItemError(res, err, "Could not update item status. Please try again later.");
  }
}

/**
 * DELETE /api/items/:id
 * Requires requireAuth. Owner or ADMIN only.
 */
export async function deleteItem(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;

    const existingItem = await prisma.item.findUnique({ where: { id } });
    if (!existingItem) {
      return sendError(res, "Item not found.", 404);
    }

    if (existingItem.userId !== req.user.id && req.user.role !== "ADMIN") {
      return sendError(res, "You do not have permission to delete this item.", 403);
    }

    await prisma.item.delete({ where: { id } });

    // Clean up associated uploaded image file from disk if present
    if (existingItem.imageUrl) {
      await deleteUploadedFile(existingItem.imageUrl);
    }

    return sendSuccess(res, "Item deleted successfully.");
  } catch (err) {
    return handleItemError(res, err, "Could not delete item. Please try again later.");
  }
}

/**
 * Central error handler for item controllers: logs the real error
 * server-side but never leaks database/internal details to the client.
 */
function handleItemError(res: Response, err: unknown, fallbackMessage: string) {
  console.error("Item error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      // Record to update/delete was not found (e.g. deleted concurrently).
      return sendError(res, "Item not found.", 404);
    }
  }

  return sendError(res, fallbackMessage, 500);
}
