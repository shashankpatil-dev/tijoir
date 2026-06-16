export const DASHBOARD_ITEMS_PER_PAGE = 6;

export function pageCount(totalItems: number, perPage: number) {
  return Math.max(1, Math.ceil(totalItems / perPage));
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
