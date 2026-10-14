import { describe, expect, it } from "vitest";
import { podCount } from "./phases";
import { SCRIPTED_FAIL_NODE, schedule } from "./scheduler";

describe("cluster scheduling", () => {
  describe("pod count matches podCount", () => {
    it("matches podCount at all key timeline positions for desktop tier (max 24)", () => {
      const progressSteps = [
        0, 0.05, 0.14, 0.2, 0.32, 0.45, 0.5, 0.6, 0.68, 0.73, 0.77, 0.82, 0.86, 0.95, 1.0,
      ];

      for (const p of progressSteps) {
        const expectedCount = podCount(p, 24);
        const targets = schedule(p, 24);
        const activeCount = targets.filter((t) => t.active).length;

        expect(activeCount).toBe(expectedCount);
      }
    });

    it("matches podCount for low tier (max 8)", () => {
      const progressSteps = [0, 0.2, 0.5, 0.7, 0.8, 0.9, 1.0];

      for (const p of progressSteps) {
        const expectedCount = podCount(p, 8);
        const targets = schedule(p, 8);
        const activeCount = targets.filter((t) => t.active).length;

        expect(activeCount).toBe(expectedCount);
        expect(activeCount).toBeLessThanOrEqual(8);
      }
    });
  });

  describe("no pod ever on a killed node", () => {
    it("never places an active pod on node 7 during second half of SCALE", () => {
      // p = 0.80 is in the second half of SCALE (0.77..0.86)
      const targets = schedule(0.8, 24);
      const activeTargets = targets.filter((t) => t.active);

      expect(activeTargets.length).toBeGreaterThan(0);
      for (const pod of activeTargets) {
        expect(pod.node).not.toBe(SCRIPTED_FAIL_NODE);
      }
    });

    it("never places an active pod on any node in the killed set", () => {
      const killed = new Set([0, 1, 4, 7]);
      const targets = schedule(0.7, 24, killed);
      const activeTargets = targets.filter((t) => t.active);

      expect(activeTargets.length).toBeGreaterThan(0);
      for (const pod of activeTargets) {
        expect(killed.has(pod.node)).toBe(false);
      }
    });

    it("reschedules pods cleanly when multiple nodes fail under max load", () => {
      const killed = new Set([2, 3, 5, 8, 9, 11]);
      const targets = schedule(0.95, 12, killed);
      const activeTargets = targets.filter((t) => t.active);

      expect(activeTargets.length).toBe(12);
      for (const pod of activeTargets) {
        expect(killed.has(pod.node)).toBe(false);
      }
    });

    it("ensures active pods have valid slots without overlap", () => {
      const targets = schedule(0.85, 24);
      const activeTargets = targets.filter((t) => t.active);
      const assignedSlots = new Set<string>();

      for (const pod of activeTargets) {
        expect(pod.node).toBeGreaterThanOrEqual(0);
        expect(pod.node).toBeLessThan(12);
        expect(pod.slot).toBeGreaterThanOrEqual(0);
        expect(pod.slot).toBeLessThan(4);

        const key = `${pod.node}:${pod.slot}`;
        expect(assignedSlots.has(key)).toBe(false);
        assignedSlots.add(key);
      }
    });
  });
});
