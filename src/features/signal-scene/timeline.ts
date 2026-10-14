/** Pure functions of scroll progress (0..1) for the hero. Nothing here keeps state. */
export const CHAPTERS = 6;
/** Width of a morph window around each chapter boundary. */
const W = 0.07;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const local = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const boundary = (k: number) => (k + 1) / CHAPTERS;

/** Continuous shape index 0..5: integer = resting on a shape, fraction = mid-morph. */
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

/** Text block state: opacity 0..1, `enter` 1->0 as it arrives, `leave` 0->1 as it goes. */
export function textState(p: number, i: number) {
  const enter = i === 0 ? 0 : 1 - local(p, boundary(i - 1) + 0.003, boundary(i - 1) + 0.04);
  const leave = i === CHAPTERS - 1 ? 0 : local(p, boundary(i) - 0.04, boundary(i) - 0.003);
  return { opacity: (1 - enter) * (1 - leave), enter, leave };
}

/** Side the formation sits on per shape (1 right, -1 left). Text takes the opposite side. */
export const FORMATION_SIDE = [0, 1, -1, 1, -1, 0] as const;
const ROT_Y = [0, -0.4, 0.35, -0.35, 0.3, 0];
const ROT_X = [0, 0.05, -0.05, 0.42, 0.78, 0.22];
const Y = [0.75, 0, 0, 0, 0, 0.45];
const SCALE = [1.5, 1, 1, 1.05, 1, 1.7];
const FIT = [0.92, 0.38, 0.38, 0.38, 0.38, 0.6];

export interface Pose {
  x: number;
  y: number;
  rotX: number;
  rotY: number;
  scale: number;
}

const mix = (arr: readonly number[], i: number, f: number) =>
  arr[i] + (arr[Math.min(i + 1, arr.length - 1)] - arr[i]) * f;

/** Formation transform for shape index `s` in a view of world size w x h. */
export function poseAt(s: number, view: { w: number; h: number; mobile: boolean }): Pose {
  const i = Math.min(Math.floor(s), CHAPTERS - 1);
  const f = smooth(s - i);
  const fit = view.mobile ? 0.92 : mix(FIT, i, f);
  const scale = Math.min(mix(SCALE, i, f), (fit * view.w) / 4.4);
  return view.mobile
    ? { x: 0, y: view.h * 0.2, rotX: mix(ROT_X, i, f), rotY: mix(ROT_Y, i, f) * 0.5, scale }
    : {
        x: mix(FORMATION_SIDE, i, f) * 0.235 * view.w,
        y: mix(Y, i, f),
        rotX: mix(ROT_X, i, f),
        rotY: mix(ROT_Y, i, f),
        scale,
      };
}

/** Frame-rate independent ease of `shown` toward `target`; dt in seconds. */
export const easeToward = (shown: number, target: number, dt: number, rate = 5) =>
  shown + (target - shown) * (1 - Math.exp(-dt * rate));
