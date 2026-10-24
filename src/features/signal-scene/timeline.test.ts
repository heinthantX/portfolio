import { describe, expect, it } from "vitest";
import { CAM_Z, chapterPose, FOV, WAVE_CHAPTER } from "./timeline";

const H = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
const views = [
  { name: "desktop 1440x900", w: (H * 1440) / 900, mobile: false },
  { name: "laptop 1280x720", w: (H * 1280) / 720, mobile: false },
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
