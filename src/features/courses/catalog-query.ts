import type { CourseQuery } from "@/lib/types";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;
export function getCatalogQuery(params: CatalogSearchParams): CourseQuery {
  const raw = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isInteger(raw) && raw > 0 && raw <= 100000 ? raw : 1;
  const search =
    typeof params.search === "string" ? params.search.trim().slice(0, 200) : "";
  const level =
    typeof params.level === "string" &&
    ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"].includes(
      params.level,
    )
      ? (params.level as CourseQuery["level"])
      : undefined;
  const category =
    typeof params.category === "string"
      ? params.category.trim().slice(0, 200)
      : "";
  const sort = params.sort === "title" ? "title" : undefined;
  const direction = params.direction === "asc" ? "asc" : undefined;
  return {
    page,
    limit: 6,
    ...(search ? { search } : {}),
    ...(level ? { level } : {}),
    ...(category ? { category } : {}),
    ...(sort ? { sort } : {}),
    ...(direction ? { direction } : {}),
  };
}

export function catalogPageHref(
  basePath: string,
  query: CourseQuery,
  page: number,
) {
  const params = new URLSearchParams({ page: String(page) });
  if (query.search) params.set("search", query.search);
  if (query.level) params.set("level", query.level);
  if (query.category) params.set("category", query.category);
  if (query.sort) params.set("sort", query.sort);
  if (query.direction) params.set("direction", query.direction);
  return `${basePath}?${params}#catalog`;
}
