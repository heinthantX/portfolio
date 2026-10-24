import { describe, expect, it } from "vitest";
import {
  api,
  data,
  glyph,
  heroShapes,
  infra,
  interfaceShape,
  matchByX,
  neuralNet,
  shipped,
  wave,
  waveCells,
  waveNet,
} from "./shapes";
import { CHAPTERS, chapterProgress, easeToward, shapeIndex, textState } from "./timeline";

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

  it("wave: a full-width field, finite, deterministic", () => {
    const a = wave(N);
    expect(a).toHaveLength(N * 3);
    expect(Array.from(a).every(Number.isFinite)).toBe(true);
    expect(wave(N)).toEqual(a);
    let lo = 0;
    let hi = 0;
    for (let i = 0; i < N; i++) {
      lo = Math.min(lo, a[i * 3]);
      hi = Math.max(hi, a[i * 3]);
      expect(Math.abs(a[i * 3 + 1])).toBeLessThanOrEqual(0.2);
      expect(Math.abs(a[i * 3 + 2])).toBeLessThanOrEqual(1);
    }
    expect(lo).toBeLessThan(-2);
    expect(hi).toBeGreaterThan(2);
  });

  it("waveCells recovers the grid from positions, in any order", () => {
    const { col, row, cols } = waveCells(wave(N));
    for (let i = 0; i < N; i += 37) {
      expect(col[i]).toBe(i % cols);
      expect(row[i]).toBe(Math.floor(i / cols));
    }
  });

  it("waveNet: links run from the horizon toward the viewer", () => {
    const f = wave(N);
    const { pairs, phase, node } = waveNet(f);
    expect(pairs.length).toBeGreaterThan(40);
    expect(phase).toHaveLength(pairs.length / 2);
    for (let k = 0; k < pairs.length; k += 2) {
      expect(f[pairs[k + 1] * 3 + 2]).toBeGreaterThan(f[pairs[k] * 3 + 2]);
      expect(node[pairs[k] * 3]).toBe(1);
    }
  });

  it("neuralNet: deterministic, valid links, cascade depth within span", () => {
    const shape = api(N);
    const a = neuralNet(shape);
    expect(neuralNet(shape)).toEqual(a);
    expect(a.pairs.length).toBeGreaterThan(80);
    for (let k = 0; k < a.pairs.length; k += 2) {
      const [i, j] = [a.pairs[k], a.pairs[k + 1]];
      expect(i).toBeLessThan(N);
      expect(a.node[i * 3]).toBe(1);
      // current runs outward: never toward a shallower neuron
      expect(a.node[j * 3 + 1]).toBeGreaterThanOrEqual(a.node[i * 3 + 1]);
      expect(a.node[j * 3 + 1]).toBeLessThanOrEqual(0.4 + 1e-6);
    }
  });

  it("matchByX keeps the points and pairs them left to right", () => {
    // ref x ranks: middle, right, left -> the target's points land in that same order
    const ref = new Float32Array([0, 0, 0, 2, 0, 0, -1, 0, 0]);
    const out = matchByX(ref, new Float32Array([5, 1, 0, 3, 2, 0, 4, 3, 0]));
    expect(Array.from(out)).toEqual([4, 3, 0, 5, 1, 0, 3, 2, 0]);
  });

  it("heroShapes returns one shape per chapter", () => {
    expect(heroShapes(100, samples)).toHaveLength(CHAPTERS);
  });
});

describe("timeline", () => {
  it("rests on integers and is monotonic", () => {
    expect(shapeIndex(0)).toBe(0);
    expect(shapeIndex(1)).toBe(CHAPTERS - 1);
    for (let i = 1; i < CHAPTERS - 1; i++) expect(shapeIndex(chapterProgress(i))).toBe(i);
    const edge = 2 / CHAPTERS; // a chapter boundary, mid-morph
    expect(shapeIndex(edge)).toBeGreaterThan(shapeIndex(edge - 0.01));
  });
  it("text is visible mid-chapter and hidden elsewhere", () => {
    expect(textState(chapterProgress(1), 1).opacity).toBe(1);
    expect(textState(chapterProgress(1), 2).opacity).toBe(0);
    expect(textState(0, 0).opacity).toBe(1);
    expect(textState(1, CHAPTERS - 1).opacity).toBe(1);
  });
  it("words finish revealing while their block is on screen", () => {
    for (let i = 1; i < CHAPTERS - 1; i++) {
      expect(textState(chapterProgress(i), i).reveal).toBe(1);
      expect(textState(chapterProgress(i - 1), i).reveal).toBe(0);
    }
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
