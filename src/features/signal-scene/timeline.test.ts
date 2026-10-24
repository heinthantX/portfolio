import { describe, expect, it } from "vitest";
import {
  activeChapter,
  CAM_Z,
  CHAPTERS,
  chapterPose,
  chapterProgress,
  FOV,
  flowMix,
  WAVE_CHAPTER,
} from "./timeline";

const H = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
const views = [
  { name: "desktop 1440x900", w: (H * 1440) / 900, mobile: false },
  { name: "laptop 1280x720", w: (H * 1280) / 720, mobile: false },
  { name: "laptop 1512x862", w: (H * 1512) / 862, mobile: false },
  { name: "laptop 1470x832", w: (H * 1470) / 832, mobile: false },
  { name: "laptop 1366x768", w: (H * 1366) / 768, mobile: false },
  { name: "laptop 1280x680", w: (H * 1280) / 680, mobile: false },
  { name: "desktop 1920x969", w: (H * 1920) / 969, mobile: false },
  { name: "ultrawide 2560x1080", w: (H * 2560) / 1080, mobile: false },
  { name: "tablet 820x1180", w: (H * 820) / 1180, mobile: false },
  { name: "mobile 390x844", w: (H * 390) / 844, mobile: true },
  { name: "mobile 360x740", w: (H * 360) / 740, mobile: true },
];

describe("chapterPose: wave", () => {
  it.each(views)("reaches the bottom of the view at $name", ({ w, mobile }) => {
    const p = chapterPose(WAVE_CHAPTER, { w, h: H, mobile });
    const nearY = p.y - p.scale * Math.sin(p.rotX);
    const nearDepth = CAM_Z - p.scale * Math.cos(p.rotX);
    expect(-nearY / nearDepth).toBeGreaterThanOrEqual(Math.tan((FOV * Math.PI) / 360));
  });
});

describe("flowMix: hand-off to the site stream", () => {
  const last = chapterProgress(CHAPTERS - 1);
  it("keeps the last chapter whole at its rest stop", () => {
    expect(activeChapter(last)).toBe(CHAPTERS - 1);
    expect(flowMix(last)).toBe(0);
  });
  it("is all stream at the end of the section, rising monotonically", () => {
    expect(flowMix(1)).toBe(1);
    let prev = 0;
    for (let p = last; p <= 1; p += 0.005) {
      expect(flowMix(p)).toBeGreaterThanOrEqual(prev);
      prev = flowMix(p);
    }
  });
});
