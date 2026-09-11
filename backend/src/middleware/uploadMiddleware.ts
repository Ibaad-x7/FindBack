import { Request, Response, NextFunction } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { ITEM_UPLOADS_DIR, ensureUploadDirectoriesExist } from "../utils/fileUtils";
import { sendError } from "../utils/apiResponse";

// Ensure destination directories exist upon startup
ensureUploadDirectoriesExist();

// Strict whitelist of permitted MIME types
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Strict whitelist of permitted file extensions
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirectoriesExist();
    cb(null, ITEM_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = rawExt === ".jpeg" ? ".jpg" : rawExt;
    // Generate cryptographically random filename
    const randomHex = crypto.randomBytes(16).toString("hex");
    const uniqueFilename = `${Date.now()}-${randomHex}${ext}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase());
    const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);

    // Explicitly reject SVG, HTML, scripts, executables, and non-whitelisted formats
    if (!isMimeAllowed || !isExtAllowed) {
      return cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and WebP image formats are permitted."
        )
      );
    }

    cb(null, true);
  },
});

/**
 * Middleware wrapper that executes single-file upload and converts
 * Multer/validation errors into structured JSON responses.
 */
export function uploadItemImageMiddleware(fieldName = "image") {
  const singleUploader = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    singleUploader(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return sendError(
              res,
              "File size exceeds the 5MB limit.",
              400
            );
          }
          return sendError(res, `Upload error: ${err.message}`, 400);
        }
        if (err instanceof Error) {
          return sendError(res, err.message, 400);
        }
        return sendError(res, "An unknown error occurred during image upload.", 500);
      }

      next();
    });
  };
}

