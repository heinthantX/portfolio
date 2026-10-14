import { describe, expect, it } from "vitest";
import { api, data, glyph, heroShapes, infra, interfaceShape, shipped } from "./shapes";
import { easeToward, shapeIndex, textState } from "./timeline";

const N = 2000;
const samples = new Float32Array([-0.5, 0.05, 0, 0, 0.5, -0.05]);
const gens = { glyph: (n: number) => glyph(samples, n), interfaceShape, api, data, infra, shipped };

describe("shapes", () => {
  for (const [name, gen] of Object.entries(gens)) {
    it(`${name}: length, finite, deterministic, bounded`, () => {
      const a = gen(N);
      expect(a).toHaveLength(N * 3);
      expect(Array.from(a).every(Number.isFinite)).toBe(true);
      expect(gen(N)).toEqual(a);
      for (let i = 0; i < N; i++) {
        expect(Math.abs(a[i * 3])).toBeLessThanOrEqual(2.3);
        expect(Math.abs(a[i * 3 + 1])).toBeLessThanOrEqual(1.6);
        expect(Math.abs(a[i * 3 + 2])).toBeLessThanOrEqual(1.1);
      }
    });
  }

  it("heroShapes returns six shapes", () => {
    expect(heroShapes(100, samples)).toHaveLength(6);
  });
});

describe("timeline", () => {
  it("rests on integers and is monotonic", () => {
    expect(shapeIndex(0)).toBe(0);
    expect(shapeIndex(1)).toBe(5);
    expect(shapeIndex(0.25)).toBe(1);
    expect(shapeIndex(0.5)).toBeGreaterThan(shapeIndex(0.49));
  });
  it("text is visible mid-chapter and hidden elsewhere", () => {
    expect(textState(0.25, 1).opacity).toBe(1);
    expect(textState(0.25, 2).opacity).toBe(0);
    expect(textState(0, 0).opacity).toBe(1);
    expect(textState(1, 5).opacity).toBe(1);
  });
});

describe("easeToward", () => {
  it("converges, never overshoots, and is frame-rate independent", () => {
    expect(easeToward(0, 1, 0)).toBe(0);
    expect(easeToward(0, 1, 10)).toBeCloseTo(1, 5);
    const one = easeToward(0, 1, 0.1);
    const two = easeToward(easeToward(0, 1, 0.05), 1, 0.05);
    expect(two).toBeCloseTo(one, 10);
    expect(one).toBeLessThan(1);
  });
});
