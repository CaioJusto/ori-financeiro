import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  // Reset to page 1 when items change significantly
  const total = items.length;

  return {
    paginatedItems,
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
  };
}
