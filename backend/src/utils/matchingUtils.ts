/**
 * Pure scoring functions for the smart matching engine. Nothing in this
 * file touches the database — it only takes plain strings/dates and
 * returns numbers, which makes it straightforward to unit test and reason
 * about independently of Prisma.
 */

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for",
  "with", "is", "was", "were", "are", "this", "that", "these", "those",
  "it", "its", "by", "from", "as", "be", "been", "being", "has", "have",
  "had", "i", "you", "he", "she", "they", "we", "my", "your", "his",
  "her", "their", "our", "near", "around", "some", "any",
]);

/** Lowercases, strips punctuation, and collapses whitespace. */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits normalized text into a set of meaningful words (stop words
 * removed, empty strings dropped). Order doesn't matter — comparisons are
 * set-based so "black wallet" and "wallet black" are equivalent. */
export function tokenize(text: string | null | undefined, removeStopWords = true): Set<string> {
  const normalized = normalizeText(text);
  if (!normalized) return new Set();

  const words = normalized.split(" ").filter(Boolean);
  const filtered = removeStopWords
    ? words.filter((word) => !STOP_WORDS.has(word))
    : words;

  return new Set(filtered);
}

/** Jaccard similarity: size of intersection / size of union, 0 when both
 * sets are empty (nothing to compare) rather than dividing by zero. */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of a) {
    if (b.has(word)) intersectionSize += 1;
  }
  const unionSize = a.size + b.size - intersectionSize;
  if (unionSize === 0) return 0;

  return intersectionSize / unionSize;
}

/** Convenience: jaccard similarity of two raw text strings. */
export function textSimilarity(
  textA: string | null | undefined,
  textB: string | null | undefined,
  removeStopWords = true
): number {
  return jaccardSimilarity(tokenize(textA, removeStopWords), tokenize(textB, removeStopWords));
}

export function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(dateA.getTime() - dateB.getTime()) / msPerDay;
}

/**
 * Tiered date-proximity score: closer dates score higher. Tiers (rather
 * than a raw formula) keep the behavior easy to explain and to test.
 */
export function dateProximityScore(dateA: Date, dateB: Date, maxPoints: number): number {
  const diff = daysBetween(dateA, dateB);

  if (diff <= 0) return maxPoints;
  if (diff <= 1) return maxPoints * 0.9;
  if (diff <= 3) return maxPoints * 0.8;
  if (diff <= 7) return maxPoints * 0.6;
  if (diff <= 14) return maxPoints * 0.4;
  if (diff <= 30) return maxPoints * 0.2;
  return 0;
}
