/** Pure functions of scroll progress (0..1) for the hero. Nothing here keeps state. */
export const CHAPTER_IDS = [
  "intro",
  "wave",
  "interface",
  "api",
  "data",
  "infra",
  "shipped",
] as const;
export const CHAPTERS = CHAPTER_IDS.length;
/** Chapter index of the first stack layer; layers run LAYER_OFFSET..LAYER_OFFSET+3. */
export const LAYER_OFFSET = CHAPTER_IDS.indexOf("interface");
export const WAVE_CHAPTER = CHAPTER_IDS.indexOf("wave");
/** Width of a morph window around each chapter boundary (~27vh of a 450vh section). */
const W = 0.077;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const local = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const boundary = (k: number) => (k + 1) / CHAPTERS;

/** Continuous shape index 0..CHAPTERS-1: integer = resting on a shape, fraction = mid-morph. */
export function shapeIndex(p: number): number {
  let s = 0;
  for (let k = 0; k < CHAPTERS - 1; k++) s += clamp01((p - boundary(k)) / W + 0.5);
  return s;
}

/** Chapter whose text/rail tick is active. */
export const activeChapter = (p: number) => Math.min(CHAPTERS - 1, Math.round(shapeIndex(p)));

/** Scroll progress that rests on chapter i. */
export const chapterProgress = (i: number) =>
  i === 0 ? 0 : i === CHAPTERS - 1 ? 0.99 : (i + 0.5) / CHAPTERS;

/** How far into its chapter the word-by-word reveal runs (progress units after it starts entering). */
const REVEAL_SPAN = CHAPTER_IDS.map((id) => (id === "wave" ? 0.07 : 0.06));

/**
 * Text block state: opacity 0..1, `enter` 1->0 as it arrives, `leave` 0->1 as it goes, and
 * `reveal` 0->1 for the word-by-word reveal, which keeps running after the block is fully in.
 */
export function textState(p: number, i: number) {
  const start = i === 0 ? 0 : boundary(i - 1);
  const enter = i === 0 ? 0 : 1 - local(p, start + 0.004, start + 0.043);
  const leave = i === CHAPTERS - 1 ? 0 : local(p, boundary(i) - 0.043, boundary(i) - 0.004);
  const reveal = i === 0 ? 1 : local(p, start, start + REVEAL_SPAN[i]);
  return { opacity: (1 - enter) * (1 - leave), enter, leave, reveal };
}

/**
 * Per-chapter formation values. x is a side (1 right, -1 left, 0 centre) times 0.235 of the view
 * width; text takes the opposite side. Each point morphs between the two endpoint poses on its
 * own path (see SignalPoints), so a change of side reads as the swarm regathering, never as the
 * whole formation sliding.
 */
export const FORMATION_SIDE = [0, 0, 1, 1, 1, 1, 0] as const;
const ROT_Y = [0, 0, -0.35, -0.35, -0.35, -0.35, 0];
const ROT_X = [0, 0.35, 0.05, -0.05, 0.42, 0.78, 0.22];
/** World-unit y offset, plus a share of the view height (the wave sits in the bottom third). */
const Y = [0.75, 0, 0, 0, 0, 0, 0.45];
const Y_H = [0, -0.37, 0, 0, 0, 0, 0];
const SCALE = [1.5, 3.2, 1, 1, 1.05, 1, 1.7];
const FIT = [0.92, 1.12, 0.38, 0.38, 0.38, 0.38, 0.6];
const MOBILE_Y_H = [0.2, -0.3, 0.2, 0.2, 0.2, 0.2, 0.2];
const MOBILE_FIT = [0.92, 1.35, 0.92, 0.92, 0.92, 0.92, 0.92];
const MOBILE_ROT_X = [0, 0.5, 0.05, -0.05, 0.42, 0.78, 0.22];

/** Camera: vertical field of view (degrees) and distance from the origin. */
export const FOV = 38;
export const CAM_Z = 7;
/** How far past the bottom edge of the view the wave's near row must reach (swell, browser chrome). */
const WAVE_BLEED = 1.06;

export interface Pose {
  x: number;
  y: number;
  rotX: number;
  rotY: number;
  scale: number;
}

/**
 * The wave pose, grown just enough that its near row (z = 1) reaches the bottom of the view. The
 * far row (z = -1) stays on the screen line it had, so the horizon does not move. On wide views
 * the near row is already past the edge and the pose is untouched; on tall, narrow ones it falls
 * short and the field would end partway down, so the scale (and the y that pins the horizon) grow.
 * Rows lie on the XZ plane tilted by rotX, so a row at z sits at y - z*s*sin(r), depth CAM_Z - z*s*cos(r).
 */
function fillWaveBottom(pose: Pose): Pose {
  const { y, rotX: r, scale: s } = pose;
  const bottom = Math.tan((FOV * Math.PI) / 360) * WAVE_BLEED;
  const far = -(y + s * Math.sin(r)) / (CAM_Z + s * Math.cos(r));
  const near = -(y - s * Math.sin(r)) / (CAM_Z - s * Math.cos(r));
  if (near >= bottom || bottom <= far) return pose;
  const grown = (CAM_Z * (bottom - far)) / ((far + bottom) * Math.cos(r) + 2 * Math.sin(r));
  return { ...pose, scale: grown, y: -far * (CAM_Z + grown * Math.cos(r)) - grown * Math.sin(r) };
}

/** Resting formation transform for chapter i in a view of world size w x h. */
export function chapterPose(i: number, view: { w: number; h: number; mobile: boolean }): Pose {
  const pose = basePose(i, view);
  return i === WAVE_CHAPTER ? fillWaveBottom(pose) : pose;
}

function basePose(i: number, view: { w: number; h: number; mobile: boolean }): Pose {
  const c = Math.max(0, Math.min(CHAPTERS - 1, i));
  if (view.mobile) {
    const scale = Math.min(SCALE[c], (MOBILE_FIT[c] * view.w) / 4.4);
    return { x: 0, y: MOBILE_Y_H[c] * view.h, rotX: MOBILE_ROT_X[c], rotY: ROT_Y[c] * 0.5, scale };
  }
  return {
    x: FORMATION_SIDE[c] * 0.235 * view.w,
    y: Y[c] + Y_H[c] * view.h,
    rotX: ROT_X[c],
    rotY: ROT_Y[c],
    scale: Math.min(SCALE[c], (FIT[c] * view.w) / 4.4),
  };
}

/** Frame-rate independent ease of `shown` toward `target`; dt in seconds. */
export const easeToward = (shown: number, target: number, dt: number, rate = 5) =>
  shown + (target - shown) * (1 - Math.exp(-dt * rate));
