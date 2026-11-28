import { expect, it } from "vitest";
import { catalogPageHref, getCatalogQuery } from "./catalog-query";

it("sends real backend search and pagination with bounded input", () => {
  expect(getCatalogQuery({ search: "  notification  ", page: "2" })).toEqual({
    search: "notification",
    page: 2,
    limit: 6,
  });
  for (const page of ["-1", "NaN", "1.5", "100001"])
    expect(getCatalogQuery({ page }).page).toBe(1);
  expect(getCatalogQuery({ search: ["ignored"], page: ["2"] })).toEqual({
    page: 1,
    limit: 6,
  });
});

it("keeps signed-in pagination on dashboard instead of redirecting through explore", () => {
  expect(catalogPageHref("/dashboard", { search: "a&b" }, 2)).toBe(
    "/dashboard?page=2&search=a%26b#catalog",
  );
});

it("validates backend filters and preserves them across pagination", () => {
  const query = getCatalogQuery({
    level: "BEGINNER",
    category: "  A&B  ",
    sort: "title",
    direction: "asc",
    search: " React ",
  });
  expect(query).toMatchObject({
    level: "BEGINNER",
    category: "A&B",
    sort: "title",
    direction: "asc",
    search: "React",
  });
  const url = new URL(
    catalogPageHref("/dashboard", query, 3),
    "http://local.test",
  );
  expect(Object.fromEntries(url.searchParams)).toEqual({
    page: "3",
    level: "BEGINNER",
    category: "A&B",
    sort: "title",
    direction: "asc",
    search: "React",
  });
  expect(url.hash).toBe("#catalog");
});

it("ignores invalid filters and bounds text input", () => {
  expect(
    getCatalogQuery({
      level: "ADMIN",
      category: ["ignored"],
      sort: "password",
      direction: "sideways",
    }),
  ).toEqual({ page: 1, limit: 6 });
  expect(
    getCatalogQuery({ search: "a".repeat(201), category: "b".repeat(201) }),
  ).toMatchObject({ search: "a".repeat(200), category: "b".repeat(200) });
});
