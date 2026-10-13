export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 100;

export interface PaginationQuery {
  page?: number;
  size?: number;
  pageSize?: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  pageSize: number;
}

export interface ResolvedPagination {
  page: number;
  size: number;
  skip: number;
}

export function resolvePagination(query: PaginationQuery): ResolvedPagination {
  const page = Math.max(DEFAULT_PAGE, Number(query.page) || DEFAULT_PAGE);
  const requestedSize = query.size ?? query.pageSize ?? DEFAULT_PAGE_SIZE;
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(requestedSize) || DEFAULT_PAGE_SIZE));

  return {
    page,
    size,
    skip: (page - 1) * size,
  };
}

export function createPaginationResult<T>(
  list: T[],
  total: number,
  page: number,
  size: number,
): PaginationResult<T> {
  return {
    list,
    total,
    page,
    size,
    pageSize: size,
  };
}
