import { describe, expect, it } from "vitest";
import { complete } from "./complete";

const cands = ["help", "whoami", "git log", "kubectl get skills", "/work", "/work/this-portfolio"];

describe("complete", () => {
  it("fills in a unique match", () => {
    expect(complete("who", cands)).toEqual({ matches: ["whoami"], common: "whoami" });
    expect(complete("KUB", cands).common).toBe("kubectl get skills");
  });
  it("fills the shared prefix first when several match", () => {
    expect(complete("/w", cands)).toEqual({
      matches: ["/work", "/work/this-portfolio"],
      common: "/work",
    });
  });
  it("offers nothing for no match, an exact command or empty input", () => {
    expect(complete("xyz", cands).matches).toEqual([]);
    expect(complete("help", cands).matches).toEqual([]);
    expect(complete("", cands)).toEqual({ matches: [], common: "" });
  });
});
