import { Request, Response } from "express";
import { MatchStatus, Prisma } from "@prisma/client";
import { sendSuccess, sendError } from "../utils/apiResponse";
import {
  runMatchingEngine,
  getMatchesForUser,
  getMatchByIdForUser,
  isUserAuthorizedForMatch,
  MATCH_SCORE_THRESHOLD,
} from "../services/matchingService";
import { prisma } from "../lib/prisma";

/**
 * POST /api/matches/run
 * Requires requireAuth. Any authenticated user can trigger a system-wide
 * matching pass — it doesn't only compare their own items, since the
 * whole point is to find matches between different people's lost/found
 * reports.
 */
export async function runMatching(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const result = await runMatchingEngine();

    return sendSuccess(res, "Matching run completed.", {
      summary: {
        consideredPairs: result.consideredPairs,
        created: result.created,
        updated: result.updated,
        threshold: MATCH_SCORE_THRESHOLD,
      },
      matches: result.matches,
    });
  } catch (err) {
    return handleMatchError(res, err, "Could not run matching. Please try again later.");
  }
}

/**
 * GET /api/matches
 * Requires requireAuth. Returns matches where the authenticated user owns
 * either the lost item or the found item, highest score first.
 */
export async function getMatches(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const matches = await getMatchesForUser(req.user.id);

    return sendSuccess(res, "Matches fetched successfully.", { matches });
  } catch (err) {
    return handleMatchError(res, err, "Could not fetch matches. Please try again later.");
  }
}

/**
 * GET /api/matches/:id
 * Requires requireAuth. Only accessible to users who own the lost item or
 * the found item involved, or an ADMIN.
 */
export async function getMatchById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return sendError(res, "Invalid match id.", 400);
    }

    const match = await getMatchByIdForUser(id);
    if (!match) {
      return sendError(res, "Match not found.", 404);
    }

    if (!isUserAuthorizedForMatch(match, req.user.id, req.user.role)) {
      return sendError(res, "You do not have permission to view this match.", 403);
    }

    return sendSuccess(res, "Match fetched successfully.", { match });
  } catch (err) {
    return handleMatchError(res, err, "Could not fetch match. Please try again later.");
  }
}

const ALLOWED_STATUS_TRANSITIONS: MatchStatus[] = [
  MatchStatus.ACCEPTED,
  MatchStatus.REJECTED,
];

/**
 * PATCH /api/matches/:id/status
 * Requires requireAuth. Only the owner of the lost item, the owner of the
 * found item, or an ADMIN may decide a match. Only PENDING -> ACCEPTED or
 * PENDING -> REJECTED transitions are allowed — once a match has been
 * decided, it can't be flipped back through this endpoint.
 */
export async function updateMatchStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return sendError(res, "Invalid match id.", 400);
    }

    const { status } = req.body ?? {};
    if (!ALLOWED_STATUS_TRANSITIONS.includes(status)) {
      return sendError(
        res,
        `status must be one of: ${ALLOWED_STATUS_TRANSITIONS.join(", ")}.`,
        400
      );
    }

    const match = await getMatchByIdForUser(id);
    if (!match) {
      return sendError(res, "Match not found.", 404);
    }

    if (!isUserAuthorizedForMatch(match, req.user.id, req.user.role)) {
      return sendError(res, "You do not have permission to update this match.", 403);
    }

    if (match.status !== MatchStatus.PENDING) {
      return sendError(res, "This match has already been decided.", 409);
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: { status: status as MatchStatus },
    });

    // Re-fetch with the full safe-owner include for a consistent response
    // shape (the update above only needs to write the status field).
    const fullMatch = await getMatchByIdForUser(updatedMatch.id);

    return sendSuccess(res, "Match status updated successfully.", {
      match: fullMatch,
    });
  } catch (err) {
    return handleMatchError(res, err, "Could not update match status. Please try again later.");
  }
}

function handleMatchError(res: Response, err: unknown, fallbackMessage: string) {
  console.error("Match error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return sendError(res, "Match not found.", 404);
    }
  }

  return sendError(res, fallbackMessage, 500);
}
