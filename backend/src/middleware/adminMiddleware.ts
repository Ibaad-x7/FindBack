import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

/**
 * Restricts a route to ADMIN users. Must be mounted *after* requireAuth,
 * since it depends on req.user already being set.
 *
 * router.get("/admin-only", requireAuth, requireAdmin, handler)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    // Defensive: this shouldn't happen if requireAuth ran first, but fail
    // closed rather than assume.
    return sendError(res, "Authentication required.", 401);
  }

  if (req.user.role !== "ADMIN") {
    return sendError(res, "Admin access required.", 403);
  }

  return next();
}
