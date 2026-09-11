import { Item, ItemStatus, ItemType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  textSimilarity,
  dateProximityScore,
} from "../utils/matchingUtils";
import { SAFE_USER_SELECT } from "../utils/safeUser";

/**
 * Weighted scoring breakdown. Weights sum to 100.
 */
export const SCORE_WEIGHTS = {
  category: 25,
  name: 20,
  description: 20,
  location: 15,
  date: 10,
  characteristics: 10,
} as const;

/** Matches at or above this score are created/stored. Lower-scoring pairs
 * are simply not persisted — there's no value in a table full of rows for
 * pairs that clearly aren't the same item. */
export const MATCH_SCORE_THRESHOLD = 50;

export interface ScoreBreakdown {
  category: number;
  name: number;
  description: number;
  location: number;
  date: number;
  characteristics: number;
}

export interface MatchScoreResult {
  score: number; // 0–100, rounded
  breakdown: ScoreBreakdown;
}

/**
 * Computes the weighted match score between a LOST item and a FOUND item.
 * Pure function of the two items — no DB access here.
 */
export function calculateMatchScore(lostItem: Item, foundItem: Item): MatchScoreResult {
  // 1. Category — same category scores full points, different scores 0.
  const categoryScore =
    lostItem.category === foundItem.category ? SCORE_WEIGHTS.category : 0;

  // 2. Item name — token-set similarity handles word-order variations
  // ("black wallet" vs "wallet black") and partial overlaps ("black
  // leather wallet" vs "black wallet").
  const nameScore = textSimilarity(lostItem.name, foundItem.name) * SCORE_WEIGHTS.name;

  // 3. Description — same idea, with common stop words filtered out so
  // "a black wallet was found near the library" and "found a wallet, it
  // is black, near the library" line up on the words that matter.
  const descriptionScore =
    textSimilarity(lostItem.description, foundItem.description) *
    SCORE_WEIGHTS.description;

  // 4. Location — same city is the primary signal (60% of the location
  // weight); the more specific location string only adds extra credit
  // when the city already matches, since comparing street-level text
  // across two different cities isn't meaningful.
  const sameCity =
    lostItem.city.trim().toLowerCase() === foundItem.city.trim().toLowerCase();
  const cityWeight = SCORE_WEIGHTS.location * 0.6;
  const locationTextWeight = SCORE_WEIGHTS.location * 0.4;
  const locationScore = sameCity
    ? cityWeight + textSimilarity(lostItem.location, foundItem.location) * locationTextWeight
    : 0;

  // 5. Date — items reported close together in time score higher.
  const dateScore = dateProximityScore(lostItem.date, foundItem.date, SCORE_WEIGHTS.date);

  // 6. Identifying characteristics / additional details — combine both
  // free-text fields per item before comparing, since either one alone
  // might be empty.
  const lostCharacteristicsText = [
    lostItem.identifyingCharacteristics,
    lostItem.additionalDetails,
  ]
    .filter(Boolean)
    .join(" ");
  const foundCharacteristicsText = [
    foundItem.identifyingCharacteristics,
    foundItem.additionalDetails,
  ]
    .filter(Boolean)
    .join(" ");
  const characteristicsScore =
    lostCharacteristicsText && foundCharacteristicsText
      ? textSimilarity(lostCharacteristicsText, foundCharacteristicsText) *
        SCORE_WEIGHTS.characteristics
      : 0;

  const breakdown: ScoreBreakdown = {
    category: round1(categoryScore),
    name: round1(nameScore),
    description: round1(descriptionScore),
    location: round1(locationScore),
    date: round1(dateScore),
    characteristics: round1(characteristicsScore),
  };

  const total =
    breakdown.category +
    breakdown.name +
    breakdown.description +
    breakdown.location +
    breakdown.date +
    breakdown.characteristics;

  return {
    score: Math.min(100, Math.round(total)),
    breakdown,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

const MATCH_INCLUDE = {
  lostItem: { include: { user: { select: SAFE_USER_SELECT } } },
  foundItem: { include: { user: { select: SAFE_USER_SELECT } } },
} satisfies Prisma.MatchInclude;

type RawMatchWithItems = Prisma.MatchGetPayload<{ include: typeof MATCH_INCLUDE }>;

/**
 * Renames each item's `user` relation to `owner` in the API response, to
 * match the convention already established by the Items API (Step 4).
 */
function toMatchResponse(match: RawMatchWithItems) {
  const { lostItem, foundItem, ...rest } = match;
  const { user: lostOwner, ...lostRest } = lostItem;
  const { user: foundOwner, ...foundRest } = foundItem;
  return {
    ...rest,
    lostItem: { ...lostRest, owner: lostOwner },
    foundItem: { ...foundRest, owner: foundOwner },
  };
}

export type MatchWithItems = ReturnType<typeof toMatchResponse>;

export interface RunMatchingResult {
  consideredPairs: number;
  created: number;
  updated: number;
  matches: MatchWithItems[];
}

/**
 * The core matching run: compares every ACTIVE LOST item against every
 * ACTIVE FOUND item, scores each pair, and persists the ones that clear
 * MATCH_SCORE_THRESHOLD.
 *
 * - New qualifying pairs are created with status PENDING.
 * - Pairs that already have a Match record get their `score` refreshed
 *   (items may have been edited since the last run) but their `status` is
 *   left untouched — a rerun should never silently flip an ACCEPTED or
 *   REJECTED match back to PENDING, or vice versa.
 * - Pairs below the threshold that don't already have a Match record are
 *   simply skipped (not stored at all).
 *
 * Runs on a moderate number of active items at a time, which is fine for
 * this project's scale — comparing every LOST item against every FOUND
 * item is O(n*m). A larger deployment would want to pre-filter candidates
 * (e.g. by category or city) before scoring.
 */
export async function runMatchingEngine(): Promise<RunMatchingResult> {
  const [lostItems, foundItems] = await Promise.all([
    prisma.item.findMany({
      where: { type: ItemType.LOST, status: ItemStatus.ACTIVE },
    }),
    prisma.item.findMany({
      where: { type: ItemType.FOUND, status: ItemStatus.ACTIVE },
    }),
  ]);

  const qualifyingPairs: { lostItem: Item; foundItem: Item; score: number }[] = [];

  for (const lostItem of lostItems) {
    for (const foundItem of foundItems) {
      const { score } = calculateMatchScore(lostItem, foundItem);
      if (score >= MATCH_SCORE_THRESHOLD) {
        qualifyingPairs.push({ lostItem, foundItem, score });
      }
    }
  }

  if (qualifyingPairs.length === 0) {
    return { consideredPairs: lostItems.length * foundItems.length, created: 0, updated: 0, matches: [] };
  }

  // Find which of the qualifying pairs already have a Match row, so we
  // know create vs. update counts and can leave `status` alone on update.
  const existingMatches = await prisma.match.findMany({
    where: {
      OR: qualifyingPairs.map((pair) => ({
        lostItemId: pair.lostItem.id,
        foundItemId: pair.foundItem.id,
      })),
    },
    select: { id: true, lostItemId: true, foundItemId: true },
  });
  const existingKey = new Set(
    existingMatches.map((m) => `${m.lostItemId}:${m.foundItemId}`)
  );

  const upsertOperations = qualifyingPairs.map((pair) =>
    prisma.match.upsert({
      where: {
        lostItemId_foundItemId: {
          lostItemId: pair.lostItem.id,
          foundItemId: pair.foundItem.id,
        },
      },
      update: {
        score: pair.score,
      },
      create: {
        lostItemId: pair.lostItem.id,
        foundItemId: pair.foundItem.id,
        score: pair.score,
      },
      include: MATCH_INCLUDE,
    })
  );

  // All upserts run atomically: either every qualifying pair is
  // persisted, or (on error) none of them are — avoids leaving the Match
  // table half-updated if something fails partway through a run.
  const results = await prisma.$transaction(upsertOperations);

  let created = 0;
  let updated = 0;
  for (const pair of qualifyingPairs) {
    const key = `${pair.lostItem.id}:${pair.foundItem.id}`;
    if (existingKey.has(key)) updated += 1;
    else created += 1;
  }

  results.sort((a, b) => b.score - a.score);

  return {
    consideredPairs: lostItems.length * foundItems.length,
    created,
    updated,
    matches: results.map(toMatchResponse),
  };
}

/** Matches where the given user owns either the lost or the found item. */
export async function getMatchesForUser(userId: string): Promise<MatchWithItems[]> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ lostItem: { userId } }, { foundItem: { userId } }],
    },
    include: MATCH_INCLUDE,
    orderBy: { score: "desc" },
  });
  return matches.map(toMatchResponse);
}

export async function getMatchByIdForUser(
  matchId: string
): Promise<MatchWithItems | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: MATCH_INCLUDE,
  });
  return match ? toMatchResponse(match) : null;
}

/** True if the given user is allowed to view/act on this match: they own
 * either the lost item or the found item, or they're an ADMIN. */
export function isUserAuthorizedForMatch(
  match: Pick<MatchWithItems, "lostItem" | "foundItem">,
  userId: string,
  userRole: string
): boolean {
  if (userRole === "ADMIN") return true;
  return match.lostItem.userId === userId || match.foundItem.userId === userId;
}
