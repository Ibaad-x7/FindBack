import { ItemCategory, ItemStatus, ItemType } from "@prisma/client";

const ITEM_TYPES = Object.values(ItemType);
const ITEM_CATEGORIES = Object.values(ItemCategory);
const ITEM_STATUSES = Object.values(ItemStatus);

export function isValidItemType(value: unknown): value is ItemType {
  return typeof value === "string" && (ITEM_TYPES as string[]).includes(value);
}

export function isValidItemCategory(value: unknown): value is ItemCategory {
  return (
    typeof value === "string" && (ITEM_CATEGORIES as string[]).includes(value)
  );
}

export function isValidItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && (ITEM_STATUSES as string[]).includes(value);
}

export function isValidDateInput(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export interface CreateItemInput {
  type?: unknown;
  name?: unknown;
  category?: unknown;
  description?: unknown;
  location?: unknown;
  city?: unknown;
  date?: unknown;
  additionalDetails?: unknown;
  identifyingCharacteristics?: unknown;
  imageUrl?: unknown;
}

export function validateCreateItemInput(input: CreateItemInput): string[] {
  const errors: string[] = [];

  if (!isValidItemType(input.type)) {
    errors.push(`type must be one of: ${ITEM_TYPES.join(", ")}.`);
  }
  if (!isNonEmptyString(input.name)) {
    errors.push("name is required.");
  }
  if (!isValidItemCategory(input.category)) {
    errors.push(`category must be one of: ${ITEM_CATEGORIES.join(", ")}.`);
  }
  if (!isNonEmptyString(input.description)) {
    errors.push("description is required.");
  }
  if (!isNonEmptyString(input.location)) {
    errors.push("location is required.");
  }
  if (!isNonEmptyString(input.city)) {
    errors.push("city is required.");
  }
  if (!isValidDateInput(input.date)) {
    errors.push("date is required and must be a valid date.");
  }
  if (input.additionalDetails !== undefined && typeof input.additionalDetails !== "string") {
    errors.push("additionalDetails must be a string.");
  }
  if (
    input.identifyingCharacteristics !== undefined &&
    typeof input.identifyingCharacteristics !== "string"
  ) {
    errors.push("identifyingCharacteristics must be a string.");
  }
  if (input.imageUrl !== undefined && typeof input.imageUrl !== "string") {
    errors.push("imageUrl must be a string.");
  }

  return errors;
}

/** Fields a client is allowed to change via PUT /api/items/:id. */
export const UPDATABLE_ITEM_FIELDS = [
  "name",
  "category",
  "description",
  "location",
  "city",
  "date",
  "additionalDetails",
  "identifyingCharacteristics",
  "status",
  "imageUrl",
] as const;

export type UpdatableItemField = (typeof UPDATABLE_ITEM_FIELDS)[number];

export interface UpdateItemInput {
  [key: string]: unknown;
}

/**
 * Validates only the fields that are actually present in the request body
 * (a partial update). Unknown/disallowed keys (e.g. userId, id) are simply
 * ignored by the caller when building the Prisma `data` object — they are
 * not validated or applied here.
 */
export function validateUpdateItemInput(input: UpdateItemInput): string[] {
  const errors: string[] = [];

  if ("name" in input && !isNonEmptyString(input.name)) {
    errors.push("name must be a non-empty string.");
  }
  if ("category" in input && !isValidItemCategory(input.category)) {
    errors.push(`category must be one of: ${ITEM_CATEGORIES.join(", ")}.`);
  }
  if ("description" in input && !isNonEmptyString(input.description)) {
    errors.push("description must be a non-empty string.");
  }
  if ("location" in input && !isNonEmptyString(input.location)) {
    errors.push("location must be a non-empty string.");
  }
  if ("city" in input && !isNonEmptyString(input.city)) {
    errors.push("city must be a non-empty string.");
  }
  if ("date" in input && !isValidDateInput(input.date)) {
    errors.push("date must be a valid date.");
  }
  if (
    "additionalDetails" in input &&
    input.additionalDetails !== null &&
    typeof input.additionalDetails !== "string"
  ) {
    errors.push("additionalDetails must be a string.");
  }
  if (
    "identifyingCharacteristics" in input &&
    input.identifyingCharacteristics !== null &&
    typeof input.identifyingCharacteristics !== "string"
  ) {
    errors.push("identifyingCharacteristics must be a string.");
  }
  if ("status" in input && !isValidItemStatus(input.status)) {
    errors.push(`status must be one of: ${ITEM_STATUSES.join(", ")}.`);
  }
  if (
    "imageUrl" in input &&
    input.imageUrl !== null &&
    typeof input.imageUrl !== "string"
  ) {
    errors.push("imageUrl must be a string.");
  }

  return errors;
}

export function validateStatusUpdateInput(input: { status?: unknown }): string[] {
  const errors: string[] = [];
  if (!isValidItemStatus(input.status)) {
    errors.push(`status must be one of: ${ITEM_STATUSES.join(", ")}.`);
  }
  return errors;
}
