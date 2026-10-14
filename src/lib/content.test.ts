import { describe, expect, it } from "vitest";
import { visible } from "./content";

const items = [
  { slug: "real", mock: false },
  { slug: "sample", mock: true },
];

describe("visible", () => {
  it("drops mock items in production", () => {
    expect(visible(items, false).map((i) => i.slug)).toEqual(["real"]);
  });
  it("keeps mock items in dev", () => {
    expect(visible(items, true)).toHaveLength(2);
  });
});
