import fs from "fs";
import path from "path";

// Project root uploads directory
export const UPLOADS_ROOT = path.resolve(__dirname, "../../../uploads");
export const ITEM_UPLOADS_DIR = path.resolve(UPLOADS_ROOT, "items");

/**
 * Ensures the uploads directory and items subdirectory exist.
 */
export function ensureUploadDirectoriesExist(): void {
  if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  }
  if (!fs.existsSync(ITEM_UPLOADS_DIR)) {
    fs.mkdirSync(ITEM_UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Safely removes an uploaded file from disk.
 * Accepts relative paths such as "/uploads/items/example.jpg" or raw filenames.
 * Guards against directory traversal and fails silently if the file does not exist.
 */
export async function deleteUploadedFile(
  imageUrl: string | null | undefined
): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== "string") {
    return false;
  }

  try {
    // Normalize URL path to clean local path
    const normalizedUrl = imageUrl.replace(/\\/g, "/");

    // Only process files in our /uploads/ hierarchy
    let relativePath: string;
    if (normalizedUrl.startsWith("/uploads/")) {
      relativePath = normalizedUrl.slice("/uploads/".length);
    } else if (normalizedUrl.startsWith("uploads/")) {
      relativePath = normalizedUrl.slice("uploads/".length);
    } else {
      // Direct filename or unmanaged URL
      relativePath = path.basename(normalizedUrl);
    }

    const resolvedPath = path.resolve(UPLOADS_ROOT, relativePath);

    // Security check: ensure target path is strictly within UPLOADS_ROOT
    if (!resolvedPath.startsWith(UPLOADS_ROOT)) {
      console.warn(`[Security] Directory traversal attempt rejected: ${imageUrl}`);
      return false;
    }

    // Check existence and unlink
    await fs.promises.access(resolvedPath, fs.constants.F_OK);
    await fs.promises.unlink(resolvedPath);
    return true;
  } catch (err) {
    // If file doesn't exist or cannot be accessed, log debug and return false without throwing
    return false;
  }
}

