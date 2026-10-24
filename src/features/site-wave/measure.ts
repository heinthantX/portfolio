import { type Box, sectionRegimes, type WaveLayout, type WaveSection } from "./waveDriver";

const HOME_IDS = ["what-i-do", "experience", "work", "how-i-work", "stack", "notes", "contact"];
const TEXT = "main h1, main h2, main h3, main p, main li, main blockquote";

/**
 * Reads the page into document coordinates: the sections the stream passes, where it starts
 * and lands, and the text it must thin under. Call on resize and route change, never per frame.
 */
export function measureLayout(vw: number, vh: number): WaveLayout | null {
  const main = document.getElementById("main");
  if (!main) return null;
  const sy = window.scrollY;
  const docRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top + sy, b: r.bottom + sy };
  };
  const hero = main.querySelector("[data-stack-hero]");

  // sections in page order: the home ids (after the about block), or main's outermost sections
  let blocks: { el: Element; id?: string }[];
  if (hero) {
    const about = hero.nextElementSibling;
    blocks = [
      ...(about ? [{ el: about, id: "about" }] : []),
      ...HOME_IDS.flatMap((id) => {
        const el = document.getElementById(id);
        return el ? [{ el, id }] : [];
      }),
    ];
  } else {
    const outer = [...main.querySelectorAll("section")].filter(
      (s) => !s.parentElement?.closest("section"),
    );
    blocks = (outer.length ? outer : [...main.children]).map((el) => ({ el }));
  }
  const rects = blocks.map((b) => ({ ...b, ...docRect(b.el) })).filter((b) => b.b - b.t > 40);
  if (!rects.length) return null;

  // long blocks are split, so a long page still changes regime as it goes
  const spans: { t: number; b: number; id?: string }[] = [];
  for (const r of rects) {
    const n = r.id ? 1 : Math.max(1, Math.round((r.b - r.t) / (1.2 * vh)));
    for (let i = 0; i < n; i++)
      spans.push({
        t: r.t + ((r.b - r.t) * i) / n,
        b: r.t + ((r.b - r.t) * (i + 1)) / n,
        id: r.id,
      });
  }
  // the last section is the funnel: a block of its own on sub-pages
  const last = rects[rects.length - 1];
  const cta = last.el.querySelector("a[data-magnetic], button[type='submit']");
  let yEnd: number;
  let endX: number;
  if (cta) {
    const c = docRect(cta);
    yEnd = (c.t + c.b) / 2;
    endX = Math.max(24, c.l - 22);
  } else {
    yEnd = last.b - Math.min(160, 0.2 * vh);
    endX = vw / 2;
  }
  if (!hero || spans[spans.length - 1].id !== "contact")
    spans.push({ t: yEnd - 500, b: yEnd + 100, id: undefined });
  const sections: WaveSection[] = spans.map((s, i) => ({
    top: s.t,
    bottom: s.b,
    ...sectionRegimes(s.id, i, i === spans.length - 1),
  }));

  // the globe pours into the stream just below it; elsewhere the stream enters from the top
  const yStart = hero ? docRect(hero).b - 0.6 * vh : 0.08 * vh;

  const text: Box[] = [];
  for (const el of main.querySelectorAll(TEXT)) {
    if (hero?.contains(el)) continue;
    const r = docRect(el);
    if (r.r - r.l > 0 && r.b - r.t > 0 && r.b > yStart) text.push(r);
  }

  return { vw, vh, yStart, yEnd: Math.max(yEnd, yStart + 600), endX, sections, text };
}
