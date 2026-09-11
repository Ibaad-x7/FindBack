import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { sendError } from "../utils/apiResponse";
import { Role } from "@prisma/client";

/**
 * Verifies the `Authorization: Bearer <token>` header, and attaches the
 * decoded { id, role } to req.user for downstream handlers.
 *
 * Any missing header, malformed header, invalid signature, or expired
 * token results in a 401 with a generic message — the client never learns
 * *which* of those happened, only that the token isn't valid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Authentication required.", 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return sendError(res, "Authentication required.", 401);
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = {
      id: decoded.userId,
      role: decoded.role as Role,
    };
    return next();
  } catch (err) {
    // Covers TokenExpiredError, JsonWebTokenError, and a missing
    // JWT_SECRET (see utils/jwt.ts) — all treated the same from the
    // client's point of view.
    return sendError(res, "Invalid or expired token.", 401);
  }
}
