import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";

/**
 * POST /api/upload/image
 * Handles uploading an item image. Requires requireAuth.
 * Returns the relative imageUrl that can be stored in Item.imageUrl.
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    if (!req.file) {
      return sendError(res, "No image file provided. Please attach an image.", 400);
    }

    const relativeUrl = `/uploads/items/${req.file.filename}`;

    return sendSuccess(
      res,
      "Image uploaded successfully.",
      {
        imageUrl: relativeUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      201
    );
  } catch (err) {
    console.error("Upload handler error:", err);
    return sendError(res, "Could not process image upload. Please try again.", 500);
  }
}

