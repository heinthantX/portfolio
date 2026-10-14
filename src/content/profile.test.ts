import { describe, expect, it } from "vitest";
import { profile } from "./profile";
import { profileSchema } from "./profile.schema";

describe("profile content", () => {
  it("parses successfully against profileSchema", () => {
    const parsed = profileSchema.parse(profile);
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe("Hein Thant");
    expect(parsed.title).toBe("Full-Stack & DevOps Engineer");
  });

  it("contains interface, api, data, and infra in stackLayers", () => {
    const layerIds = profile.stackLayers.map((layer) => layer.id);
    expect(layerIds).toContain("interface");
    expect(layerIds).toContain("api");
    expect(layerIds).toContain("data");
    expect(layerIds).toContain("infra");
  });

  it("has all 7 capability areas", () => {
    expect(profile.capabilities).toHaveLength(7);
    const capIds = profile.capabilities.map((c) => c.id);
    expect(capIds).toEqual([
      "frontend",
      "mobile",
      "backend",
      "data",
      "security",
      "devops",
      "observability",
    ]);
  });
});
