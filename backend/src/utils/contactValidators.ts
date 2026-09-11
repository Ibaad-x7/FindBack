import { ContactRequestStatus } from "@prisma/client";

export interface CreateContactRequestInput {
  itemId?: unknown;
  message?: unknown;
}

export function validateCreateContactRequestInput(
  input: CreateContactRequestInput
): string[] {
  const errors: string[] = [];

  if (typeof input.itemId !== "string" || input.itemId.trim().length === 0) {
    errors.push("itemId is required.");
  }

  if (typeof input.message !== "string" || input.message.trim().length === 0) {
    errors.push("message is required.");
  } else if (input.message.trim().length > 1000) {
    errors.push("message cannot exceed 1000 characters.");
  }

  return errors;
}

const ALLOWED_STATUS_TRANSITIONS: ContactRequestStatus[] = [
  ContactRequestStatus.ACCEPTED,
  ContactRequestStatus.REJECTED,
];

export function isValidContactRequestStatus(
  status: unknown
): status is ContactRequestStatus {
  return (
    typeof status === "string" &&
    ALLOWED_STATUS_TRANSITIONS.includes(status as ContactRequestStatus)
  );
}

