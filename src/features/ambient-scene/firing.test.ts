import { describe, expect, it } from "vitest";
import { createFiring, nearestLinks } from "./firing";

const line = [
  [0, 1],
  [1, 2],
  [2, 3],
] as const;
const always = () => 0;

describe("createFiring", () => {
  it("a fired node cascades down the chain, one link per travel time", () => {
    const f = createFiring(4, line, always, { rate: 0, carry: 1, travel: 0.4 });
    f.fire(0);
    expect(f.flash[0]).toBe(1);
    for (let i = 0; i < 9; i++) f.step(0.1);
    expect(f.flash[2]).toBeGreaterThan(0.6);
    expect(f.flash[3]).toBe(0);
    for (let i = 0; i < 3; i++) f.step(0.1);
    expect(f.flash[3]).toBeGreaterThan(0.6);
  });
  it("refractory nodes do not bounce pulses back forever", () => {
    const f = createFiring(4, line, always, { rate: 0, carry: 1 });
    f.fire(1);
    for (let i = 0; i < 100; i++) f.step(0.05);
    expect(f.pulses).toHaveLength(0);
  });
  it("fires on its own and flashes fade", () => {
    const f = createFiring(4, line, () => 0.001, { rate: 1 });
    f.step(0.1);
    expect(Math.max(...f.flash)).toBe(1);
    const g = createFiring(4, line, () => 0.99, { rate: 0 });
    g.fire(0);
    g.step(1);
    expect(g.flash[0]).toBeLessThan(0.02);
  });
});

describe("nearestLinks", () => {
  it("links each point to its nearest, once each", () => {
    const pts = [
      [0, 0],
      [1, 0],
      [5, 0],
    ];
    expect(nearestLinks(pts, 1)).toEqual([
      [0, 1],
      [1, 2],
    ]);
    expect(nearestLinks(pts, 1, 2)).toEqual([[0, 1]]);
  });
});
