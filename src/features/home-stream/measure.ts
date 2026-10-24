import { type Box, sectionRegimes, type WaveLayout, type WaveSection } from "./waveDriver";

const HOME_IDS = ["what-i-do", "experience", "work", "how-i-work", "stack", "notes", "contact"];
const TEXT = "main h1, main h2, main h3, main p, main li, main blockquote";

/**
 * Reads the home page into document coordinates: the sections the stream passes, where it starts
 * (just under the hero) and lands (the Contact CTA), and the text it must thin under. Call on
 * resize and layout changes, never per frame. Null when the hero is not on the page.
 */
export function measureLayout(vw: number, vh: number): WaveLayout | null {
  const main = document.getElementById("main");
  const hero = main?.querySelector("[data-stack-hero]");
  if (!main || !hero) return null;
  const sy = window.scrollY;
  const docRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top + sy, b: r.bottom + sy };
  };

  // the about block, then the home sections in page order
  const about = hero.nextElementSibling;
  const blocks = [
    ...(about ? [{ el: about, id: "about" }] : []),
    ...HOME_IDS.flatMap((id) => {
      const el = document.getElementById(id);
      return el ? [{ el, id }] : [];
    }),
  ];
  const rects = blocks.map((b) => ({ ...b, ...docRect(b.el) })).filter((b) => b.b - b.t > 40);
  if (!rects.length) return null;

  // the stream lands just left of the last section's CTA
  const last = rects[rects.length - 1];
  const cta = last.el.querySelector("a[data-magnetic]");
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
  const spans = rects.map((r) => ({ t: r.t, b: r.b, id: r.id }));
  if (spans[spans.length - 1].id !== "contact")
    spans.push({ t: yEnd - 500, b: yEnd + 100, id: "" });
  const sections: WaveSection[] = spans.map((s, i) => ({
    top: s.t,
    bottom: s.b,
    ...sectionRegimes(s.id || undefined, i, i === spans.length - 1),
  }));

  // the shipped globe pours into the stream just below it
  const yStart = docRect(hero).b - 0.6 * vh;

  const text: Box[] = [];
  for (const el of main.querySelectorAll(TEXT)) {
    if (hero.contains(el)) continue;
    const r = docRect(el);
    if (r.r - r.l > 0 && r.b - r.t > 0 && r.b > yStart) text.push(r);
  }

  return { vw, vh, yStart, yEnd: Math.max(yEnd, yStart + 600), endX, sections, text };
}
