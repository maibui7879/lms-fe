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
