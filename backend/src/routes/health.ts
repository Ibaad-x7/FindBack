import { Router, Request, Response } from "express";
import { env } from "../config/env";

const router = Router();

/**
 * GET /api/health
 * Simple liveness check used by the frontend to confirm the API is reachable.
 * Also reports whether a DATABASE_URL has been configured (does not open a
 * DB connection yet — Prisma models/queries land in Step 2).
 */
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "FindBack API is running",
    environment: env.nodeEnv,
    databaseConfigured: Boolean(env.databaseUrl),
    timestamp: new Date().toISOString(),
  });
});

export default router;
