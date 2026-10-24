import { describe, expect, it } from "vitest";
import {
  assign,
  CH,
  createWave,
  flowAttributes,
  MARGIN,
  MAX_PACKETS,
  REGIMES,
  ROWS,
  sectionRegimes,
  stepWave,
  table,
  type WaveLayout,
} from "./waveDriver";

const IDS = ["about", "what-i-do", "experience", "work", "how-i-work", "stack", "notes", "contact"];
const W = 1440;
const H = 900;

function homeLayout(): WaveLayout {
  const sections = IDS.map((id, i) => ({
    top: 3600 + i * 1200,
    bottom: 3600 + (i + 1) * 1200,
    ...sectionRegimes(id, i, i === IDS.length - 1),
  }));
  return {
    vw: W,
    vh: H,
    yStart: 3200,
    yEnd: 3600 + IDS.length * 1200 - 300,
    endX: 400,
    sections,
    text: [{ l: 120, r: 700, t: 5000, b: 5080 }],
  };
}

/** Run the wave for `seconds` at 60 fps, at a fixed scroll. */
function run(L: WaveLayout, scroll: number, seconds: number, st = createWave()) {
  for (let i = 0; i < seconds * 60; i++)
    stepWave(st, L, scroll, 1 / 60, { packets: true, flow: 1 });
  return st;
}
const rowOf = (scroll: number, y: number) =>
  Math.round(((y - scroll + MARGIN) / (H + 2 * MARGIN)) * (ROWS - 1));
const spineAt = (st: ReturnType<typeof createWave>, row: number) => table.at(st, 0, row)[0];

describe("assign", () => {
  const st = createWave();
  stepWave(st, homeLayout(), 0, 0, { packets: false, flow: 1 });
  const ri = (r: (typeof REGIMES)[number]) => REGIMES.indexOf(r);

  it("starts on each section's base and ends on the funnel", () => {
    expect(assign(st, 0).map((r) => REGIMES[r])).toEqual([
      "river",
      "pool",
      "braid",
      "pool",
      "fibre",
      "river",
      "pool",
      "funnel",
    ]);
  });

  it("re-picks every epoch: never the previous pick, never the previous section's", () => {
    for (let e = 1; e < 40; e++) {
      const prev = assign(st, e - 1);
      const cur = assign(st, e);
      expect(cur[cur.length - 1]).toBe(ri("funnel"));
      for (let s = 0; s < cur.length - 1; s++) {
        expect(cur[s]).not.toBe(prev[s]);
        if (s > 0 && cur[s] === cur[s - 1]) {
          // only allowed when no other candidate exists
          const free = st.layout?.sections[s].cand.filter((r) => r !== prev[s] && r !== cur[s - 1]);
          expect(free).toEqual([]);
        }
      }
    }
  });

  it("card sections lean to pool", () => {
    for (const id of ["what-i-do", "work", "notes"])
      expect(REGIMES[sectionRegimes(id, 1, false).base]).toBe("pool");
  });
});

describe("stepWave", () => {
  it("is deterministic", () => {
    const L = homeLayout();
    const a = run(L, 5200, 3);
    const b = run(L, 5200, 3);
    expect(Array.from(a.table)).toEqual(Array.from(b.table));
    expect(Array.from(a.sprites.subarray(0, a.spriteCount * 5))).toEqual(
      Array.from(b.sprites.subarray(0, b.spriteCount * 5)),
    );
  });

  it("blends regimes so every row's weights sum to 1", () => {
    const st = run(homeLayout(), 6100, 1);
    for (let j = 0; j < ROWS; j++) {
      let sum = 0;
      for (let r = 0; r < REGIMES.length; r++) sum += st.mT[r * ROWS + j];
      expect(sum).toBeCloseTo(1, 5);
    }
  });

  it("wanders both ways down the page, never along a straight line", () => {
    const L = homeLayout();
    const xs: number[] = [];
    for (let y = 4400; y < 10_000; y += 100) {
      const st = createWave();
      stepWave(st, L, y - H / 2, 0, { packets: false, flow: 1 });
      xs.push(spineAt(st, rowOf(y - H / 2, y)));
    }
    expect(Math.min(...xs)).toBeLessThan(-0.05 * W);
    expect(Math.max(...xs)).toBeGreaterThan(0.05 * W);
    // second differences: it curves, and not with one steady period
    const curv = xs.slice(2).map((x, i) => x - 2 * xs[i + 1] + xs[i]);
    expect(Math.max(...curv.map(Math.abs))).toBeGreaterThan(1);
    const flips = curv.slice(1).filter((c, i) => Math.sign(c) !== Math.sign(curv[i])).length;
    expect(flips).toBeGreaterThan(2);
  });

  it("drifts slowly over time", () => {
    const L = homeLayout();
    const scroll = 6000;
    const row = rowOf(scroll, 6450);
    const st = run(L, scroll, 0.1);
    const x0 = spineAt(st, row);
    run(L, scroll, 0.5, st);
    const x1 = spineAt(st, row);
    run(L, scroll, 20, st);
    const x2 = spineAt(st, row);
    expect(Math.abs(x1 - x0)).toBeLessThan(0.02 * W);
    expect(Math.abs(x2 - x0)).toBeGreaterThan(1);
  });

  it("marks rows that cross text, with the text's x range", () => {
    const st = run(homeLayout(), 4700, 0.1);
    const on = table.at(st, table.text, rowOf(4700, 5040));
    expect(on[2]).toBe(1);
    expect([on[0], on[1]]).toEqual([120, 700]);
    expect(table.at(st, table.text, rowOf(4700, 5400))[2]).toBe(0);
  });

  it("funnels every channel to the endpoint", () => {
    const L = homeLayout();
    const st = run(L, L.yEnd - H / 2, 0.1);
    const row = rowOf(L.yEnd - H / 2, L.yEnd - 5);
    const xs = Array.from({ length: CH }, (_, c) => table.at(st, c, row)[0]);
    for (const x of xs) expect(Math.abs(x - (L.endX - W / 2))).toBeLessThan(20);
    expect(table.at(st, 0, row)[1]).toBeLessThan(8);
  });

  it("keeps packets bounded, sends some upstream as acks, and resends drops", () => {
    const L = homeLayout();
    const st = createWave();
    let acks = 0;
    let maxN = 0;
    let resent = 0;
    for (let i = 0; i < 60 * 60; i++) {
      stepWave(st, L, 6000, 1 / 60, { packets: true, flow: 1 });
      maxN = Math.max(maxN, st.packets.length);
      acks += st.packets.filter((p) => p.dir < 0 && p.age === 1 / 60).length;
      resent += st.pend.length > 0 ? 1 : 0;
    }
    expect(maxN).toBeLessThanOrEqual(MAX_PACKETS);
    expect(maxN).toBeGreaterThan(5);
    expect(acks).toBeGreaterThan(0);
    expect(resent).toBeGreaterThan(0);
  });

  it("stands still with dt = 0 (reduced motion)", () => {
    const L = homeLayout();
    const st = createWave();
    stepWave(st, L, 6000, 0, { packets: false, flow: 1 });
    const a = Array.from(st.table);
    const off = Array.from(st.off);
    stepWave(st, L, 6000, 0, { packets: false, flow: 1 });
    expect(Array.from(st.table)).toEqual(a);
    expect(Array.from(st.off)).toEqual(off);
    expect(st.packets).toHaveLength(0);
  });
});

describe("flowAttributes", () => {
  it("spreads points over every channel, clamps u, and keeps phase in 0..1", () => {
    const a = flowAttributes(16000);
    const per = [0, 0, 0, 0, 0];
    for (let i = 0; i < 16000; i++) {
      per[a[i * 4]]++;
      expect(Math.abs(a[i * 4 + 1])).toBeLessThanOrEqual(2.8);
      expect(a[i * 4 + 2]).toBeGreaterThanOrEqual(0);
      expect(a[i * 4 + 2]).toBeLessThan(1);
      expect(a[i * 4 + 3]).toBeLessThan(4);
    }
    expect(per).toEqual([3200, 3200, 3200, 3200, 3200]);
  });
});
