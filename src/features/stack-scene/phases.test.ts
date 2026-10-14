import { describe, expect, it } from "vitest";
import { local, phaseAt, podCount, statusText } from "./phases";

describe("phases", () => {
  describe("phaseAt boundaries", () => {
    it("returns DRAW for progress below 0.14", () => {
      expect(phaseAt(-0.5)).toBe("DRAW");
      expect(phaseAt(0)).toBe("DRAW");
      expect(phaseAt(0.05)).toBe("DRAW");
      expect(phaseAt(0.1399)).toBe("DRAW");
    });

    it("returns BUILD for 0.14 <= p < 0.32", () => {
      expect(phaseAt(0.14)).toBe("BUILD");
      expect(phaseAt(0.2)).toBe("BUILD");
      expect(phaseAt(0.3199)).toBe("BUILD");
    });

    it("returns EXPLODE for 0.32 <= p < 0.50", () => {
      expect(phaseAt(0.32)).toBe("EXPLODE");
      expect(phaseAt(0.4)).toBe("EXPLODE");
      expect(phaseAt(0.4999)).toBe("EXPLODE");
    });

    it("returns RUN for 0.50 <= p < 0.68", () => {
      expect(phaseAt(0.5)).toBe("RUN");
      expect(phaseAt(0.6)).toBe("RUN");
      expect(phaseAt(0.6799)).toBe("RUN");
    });

    it("returns SCALE for 0.68 <= p < 0.86", () => {
      expect(phaseAt(0.68)).toBe("SCALE");
      expect(phaseAt(0.77)).toBe("SCALE");
      expect(phaseAt(0.8599)).toBe("SCALE");
    });

    it("returns DEPLOYED for p >= 0.86", () => {
      expect(phaseAt(0.86)).toBe("DEPLOYED");
      expect(phaseAt(0.95)).toBe("DEPLOYED");
      expect(phaseAt(1.0)).toBe("DEPLOYED");
      expect(phaseAt(1.5)).toBe("DEPLOYED");
    });
  });

  describe("local clamping", () => {
    it("clamps values below range to 0", () => {
      expect(local(-1, 0.2, 0.8)).toBe(0);
      expect(local(0, 0.2, 0.8)).toBe(0);
      expect(local(0.2, 0.2, 0.8)).toBe(0);
    });

    it("clamps values above range to 1", () => {
      expect(local(0.8, 0.2, 0.8)).toBe(1);
      expect(local(0.9, 0.2, 0.8)).toBe(1);
      expect(local(2.0, 0.2, 0.8)).toBe(1);
    });

    it("interpolates linearly inside range", () => {
      expect(local(0.5, 0.2, 0.8)).toBeCloseTo(0.5, 5);
      expect(local(0.35, 0.2, 0.8)).toBeCloseTo(0.25, 5);
    });

    it("handles invalid ranges safely", () => {
      expect(local(0.5, 0.8, 0.2)).toBe(0);
      expect(local(0.5, 0.5, 0.5)).toBe(0);
    });
  });

  describe("statusText", () => {
    it("returns correct status text per SPEC phase", () => {
      expect(statusText(0.05)).toBe("drafting spec…");
      expect(statusText(0.2)).toBe("building…");
      expect(statusText(0.4)).toBe("4 layers · ready");
      expect(statusText(0.6)).toBe("routing requests");
      expect(statusText(0.9)).toBe("deployed ✓");
    });

    it("splits SCALE phase at second half (p >= 0.77)", () => {
      expect(statusText(0.7)).toBe("scaling 3 → 12");
      expect(statusText(0.76)).toBe("scaling 3 → 12");
      expect(statusText(0.77)).toBe("node-07 lost · rescheduling");
      expect(statusText(0.82)).toBe("node-07 lost · rescheduling");
    });
  });

  describe("podCount monotonic growth", () => {
    it("is strictly monotonic non-decreasing across all progress steps", () => {
      let prevCount = podCount(0, 12);
      for (let p = 0; p <= 1.0; p += 0.005) {
        const count = podCount(p, 12);
        expect(count).toBeGreaterThanOrEqual(prevCount);
        prevCount = count;
      }
    });

    it("reaches expected milestones for max=12 and max=24", () => {
      expect(podCount(0, 12)).toBe(0);
      expect(podCount(0.5, 12)).toBe(3);
      expect(podCount(1.0, 12)).toBe(12);

      expect(podCount(0, 24)).toBe(0);
      expect(podCount(0.5, 24)).toBe(3);
      expect(podCount(1.0, 24)).toBe(12);
    });

    it("respects lower max bounds", () => {
      expect(podCount(1.0, 8)).toBe(8);
      expect(podCount(0.5, 8)).toBe(3);
      expect(podCount(1.0, 2)).toBe(2);
    });
  });
});
