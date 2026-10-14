import { describe, expect, it } from "vitest";
import { variantForPath } from "./variant";

describe("variantForPath", () => {
  it("maps routes to variants", () => {
    expect(variantForPath("/work")).toBe("sheets");
    expect(variantForPath("/work/some-case")).toBe("sheets");
    expect(variantForPath("/notes/post")).toBe("field");
    expect(variantForPath("/resume")).toBe("graph");
    expect(variantForPath("/uses")).toBe("graph");
    expect(variantForPath("/contact")).toBe("packets");
  });

  it("renders nothing on home, lab, lookalikes and unknown paths", () => {
    for (const p of ["/", "/lab", "/lab/x", "/workshop", "/notesx", "/nope"]) {
      expect(variantForPath(p)).toBeNull();
    }
  });
});
