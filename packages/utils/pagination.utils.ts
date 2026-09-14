import { CONSTANT } from "../constants";

export interface PaginationQuery {
  page?: string;
  limit?: string;
  query?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const parsePagination = (query: PaginationQuery): PaginationParams => {
  const page = Math.max(1, Math.trunc(Number(query.page)) || CONSTANT.PAGINATION.DEFAULT_PAGE);
  const requestedLimit = Math.trunc(Number(query.limit)) || CONSTANT.PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, requestedLimit), CONSTANT.PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
