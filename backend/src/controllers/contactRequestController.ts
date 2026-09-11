import { Request, Response } from "express";
import { ContactRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { SAFE_USER_SELECT, SafeUser } from "../utils/safeUser";
import {
  isValidContactRequestStatus,
  validateCreateContactRequestInput,
} from "../utils/contactValidators";
import { createNotification } from "../services/notificationService";

/**
 * Sanitizes a user profile in the context of a contact request.
 * If revealContact is false, email and phone are masked/omitted for privacy.
 */
function sanitizeContactUser(
  user: SafeUser,
  revealContact: boolean
): Partial<SafeUser> {
  if (revealContact) {
    return user;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, phone, ...masked } = user;
  return masked;
}

/**
 * Formats a contact request for API output based on the viewer's identity and status.
 */
function toContactRequestResponse<
  T extends {
    sender: SafeUser;
    receiver: SafeUser;
    status: ContactRequestStatus;
    [key: string]: unknown;
  }
>(request: T, viewerId: string, isAdmin = false) {
  const isAccepted = request.status === ContactRequestStatus.ACCEPTED;
  const isSender = request.sender.id === viewerId;
  const isReceiver = request.receiver.id === viewerId;

  // Contact info is revealed if the request is accepted or the viewer is an ADMIN
  const revealReceiverInfo = isAccepted || isAdmin;
  const revealSenderInfo = isAccepted || isAdmin;

  return {
    ...request,
    sender: sanitizeContactUser(request.sender, revealSenderInfo || isSender),
    receiver: sanitizeContactUser(request.receiver, revealReceiverInfo || isReceiver),
  };
}

/**
 * POST /api/contact-requests
 * Sends a contact request regarding a specific item.
 * Requires requireAuth.
 */
export async function createContactRequest(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { itemId, message } = req.body ?? {};
    const validationErrors = validateCreateContactRequestInput({ itemId, message });
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(" "), 400);
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId as string },
      include: { user: { select: SAFE_USER_SELECT } },
    });

    if (!item) {
      return sendError(res, "Item not found.", 404);
    }

    // Security check: cannot contact self for own item
    if (item.userId === req.user.id) {
      return sendError(
        res,
        "You cannot send a contact request for an item you reported.",
        400
      );
    }

    // Anti-spam check: prevent duplicate pending requests for the same item
    const existingPending = await prisma.contactRequest.findFirst({
      where: {
        senderId: req.user.id,
        itemId: item.id,
        status: ContactRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      return sendError(
        res,
        "You already have a pending contact request for this item. Please wait for the reporter to respond.",
        409
      );
    }

    const contactRequest = await prisma.contactRequest.create({
      data: {
        senderId: req.user.id,
        receiverId: item.userId,
        itemId: item.id,
        message: (message as string).trim(),
        status: ContactRequestStatus.PENDING,
      },
      include: {
        item: true,
        sender: { select: SAFE_USER_SELECT },
        receiver: { select: SAFE_USER_SELECT },
      },
    });

    // Notify the item owner of the new contact request
    const senderName = contactRequest.sender.name || "A user";
    await createNotification({
      userId: item.userId,
      title: "New Contact Request",
      message: `${senderName} sent you a message regarding '${item.name}': "${(message as string).trim()}"`,
    });

    return sendSuccess(
      res,
      "Contact request sent successfully.",
      {
        contactRequest: toContactRequestResponse(
          contactRequest,
          req.user.id,
          req.user.role === "ADMIN"
        ),
      },
      201
    );
  } catch (err) {
    return handleContactError(res, err, "Could not send contact request.");
  }
}

/**
 * GET /api/contact-requests/received
 * Retrieves contact requests sent to the authenticated user.
 * Requires requireAuth.
 */
export async function getReceivedRequests(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const requests = await prisma.contactRequest.findMany({
      where: { receiverId: req.user.id },
      include: {
        item: true,
        sender: { select: SAFE_USER_SELECT },
        receiver: { select: SAFE_USER_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = requests.map((r) =>
      toContactRequestResponse(r, req.user!.id, req.user!.role === "ADMIN")
    );

    return sendSuccess(res, "Received contact requests fetched successfully.", {
      requests: formatted,
    });
  } catch (err) {
    return handleContactError(res, err, "Could not fetch received requests.");
  }
}

/**
 * GET /api/contact-requests/sent
 * Retrieves contact requests sent by the authenticated user.
 * Requires requireAuth.
 */
export async function getSentRequests(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const requests = await prisma.contactRequest.findMany({
      where: { senderId: req.user.id },
      include: {
        item: true,
        sender: { select: SAFE_USER_SELECT },
        receiver: { select: SAFE_USER_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = requests.map((r) =>
      toContactRequestResponse(r, req.user!.id, req.user!.role === "ADMIN")
    );

    return sendSuccess(res, "Sent contact requests fetched successfully.", {
      requests: formatted,
    });
  } catch (err) {
    return handleContactError(res, err, "Could not fetch sent requests.");
  }
}

/**
 * PATCH /api/contact-requests/:id/status
 * Accepts or Rejects a contact request.
 * Only the receiver or an ADMIN can decide the request.
 * Only transitions from PENDING -> ACCEPTED or PENDING -> REJECTED are allowed.
 */
export async function updateRequestStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!isValidContactRequestStatus(status)) {
      return sendError(
        res,
        "status must be either 'ACCEPTED' or 'REJECTED'.",
        400
      );
    }

    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id },
      include: {
        item: true,
        sender: { select: SAFE_USER_SELECT },
        receiver: { select: SAFE_USER_SELECT },
      },
    });

    if (!existingRequest) {
      return sendError(res, "Contact request not found.", 404);
    }

    // Security check: only receiver or ADMIN can decide the request
    if (
      existingRequest.receiverId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return sendError(
        res,
        "You do not have permission to update this contact request.",
        403
      );
    }

    if (existingRequest.status !== ContactRequestStatus.PENDING) {
      return sendError(
        res,
        "This contact request has already been decided.",
        409
      );
    }

    const updatedRequest = await prisma.contactRequest.update({
      where: { id },
      data: { status: status as ContactRequestStatus },
      include: {
        item: true,
        sender: { select: SAFE_USER_SELECT },
        receiver: { select: SAFE_USER_SELECT },
      },
    });

    // Notify the sender of the decision
    const receiverName = existingRequest.receiver.name || "The reporter";
    const itemName = existingRequest.item.name;

    if (status === ContactRequestStatus.ACCEPTED) {
      await createNotification({
        userId: existingRequest.senderId,
        title: "Contact Request Accepted",
        message: `${receiverName} accepted your contact request for '${itemName}'. You can now exchange contact details.`,
      });
    } else {
      await createNotification({
        userId: existingRequest.senderId,
        title: "Contact Request Declined",
        message: `Your contact request for '${itemName}' was declined by ${receiverName}.`,
      });
    }

    return sendSuccess(res, `Contact request ${status.toLowerCase()} successfully.`, {
      contactRequest: toContactRequestResponse(
        updatedRequest,
        req.user.id,
        req.user.role === "ADMIN"
      ),
    });
  } catch (err) {
    return handleContactError(res, err, "Could not update contact request status.");
  }
}

function handleContactError(res: Response, err: unknown, fallbackMessage: string) {
  console.error("Contact request error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return sendError(res, "Contact request not found.", 404);
    }
  }

  return sendError(res, fallbackMessage, 500);
}

