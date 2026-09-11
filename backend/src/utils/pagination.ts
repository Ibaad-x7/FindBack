const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parses `page`/`limit` query params into safe, bounded integers.
 * Invalid or missing values fall back to sane defaults rather than
 * erroring — pagination params are a convenience, not a strict contract.
 */
export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
}): ParsedPagination {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;

  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}
