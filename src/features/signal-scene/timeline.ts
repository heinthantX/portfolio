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
 * width; text takes the opposite side. Each shape rests still on its pose while its text is read;
 * between chapters the whole formation travels to the next pose along a curved route (see
 * `travelRoute`) and morphs on the way, so it reads as one body flowing, not a swap in place.
 */
export const FORMATION_SIDE = [0, 0, 1, 1, 1, 1, 0] as const;
/** Share of view width the formation sits right of centre; infra sits a little inboard to clear the rail labels. */
const SIDE_X = [0, 0, 0.235, 0.235, 0.235, 0.19, 0];
const ROT_Y = [0, 0, -0.35, -0.35, -0.35, -0.35, 0];
const ROT_X = [0, 0.35, 0.05, -0.05, 0.42, 0.3, 0.22];
/** World-unit y offset, plus a share of the view height (the wave sits in the bottom third). */
const Y = [0.75, 0, 0, 0, 0, 0, 0.45];
const Y_H = [0, -0.37, 0, 0, 0, 0, 0];
const SCALE = [1.5, 3.2, 1, 1, 1.05, 1, 1.7];
const FIT = [0.92, 1.12, 0.38, 0.38, 0.38, 0.32, 0.6];
const MOBILE_Y_H = [0.2, -0.3, 0.2, 0.2, 0.2, 0.2, 0.2];
const MOBILE_FIT = [0.92, 1.35, 0.92, 0.92, 0.92, 0.92, 0.92];
const MOBILE_ROT_X = [0, 0.5, 0.05, -0.05, 0.42, 0.3, 0.22];

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
    x: FORMATION_SIDE[c] * SIDE_X[c] * view.w,
    y: Y[c] + Y_H[c] * view.h,
    rotX: ROT_X[c],
    rotY: ROT_Y[c],
    scale: Math.min(SCALE[c], (FIT[c] * view.w) / 4.4),
  };
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * The route the formation travels on boundary k (chapter k -> k+1): a cubic Bezier from the
 * `from` pose's position through two control points to the `to` pose's, plus a one-shot extra
 * turn and size swell that rise and unwind along the way (zero at both ends, so poses land exactly).
 * Scroll-driven, never timed: no sway.
 */
export interface Route {
  /** control points: c1 sets the departure direction, c2 the arrival one */
  c1: Vec3;
  c2: Vec3;
  /** extra rotX / rotY (radians) at mid-route, unwound by arrival */
  spinX: number;
  spinY: number;
  /** extra scale at mid-route, as a share (0.1 = 10% bigger) */
  grow: number;
}

/**
 * A "bow": quadratic route through one control point, set by
 * - `bend`: sideways pull, as a share of the travel distance, to the left of the travel direction
 *   (negative = right),
 * - `dip`: vertical pull as a share of the view height (negative = down),
 * - `z`: depth pull toward the camera in world units (negative = away).
 * It is drawn as the cubic that traces the same curve.
 */
interface Bow {
  kind: "bow";
  bend: number;
  dip: number;
  z: number;
}
/**
 * A "flight": two control points, c1 offset from the start and c2 from the end, x as a share of
 * the view width (positive = toward the outer edge of the formation's side), y as a share of the
 * view height, z in world units toward the camera. Plus extra spin and grow at mid-route.
 */
interface Flight {
  kind: "flight";
  c1: [number, number, number];
  c2: [number, number, number];
  spinX: number;
  spinY: number;
  grow: number;
}
const ROUTE: (Bow | Flight)[] = [
  // intro -> wave: the name sinks, swelling toward you as it spreads
  { kind: "bow", bend: 0.12, dip: -0.1, z: 0.9 },
  // wave -> interface: rises first, then sweeps right into the column
  { kind: "bow", bend: 0.34, dip: 0, z: 0.5 },
  // interface -> api: steps toward you and swings out wide, then settles back into the column
  {
    kind: "flight",
    c1: [0.08, 0.1, 1],
    c2: [0.09, -0.06, 1],
    spinX: -0.15,
    spinY: 0.3,
    grow: 0.15,
  },
  // api -> data: sinks a level into storage, down and away, then rises into place from below
  {
    kind: "flight",
    c1: [-0.02, -0.26, -1],
    c2: [0.02, -0.42, -0.6],
    spinX: 0.35,
    spinY: 0,
    grow: -0.1,
  },
  // data -> infra: drifts up and out to the edge, curls round below and swings into the harbour
  {
    kind: "flight",
    c1: [0.16, 0.46, -0.8],
    c2: [0.18, -0.3, 0.7],
    spinX: 0,
    spinY: 0.9,
    grow: 0,
  },
  // infra -> shipped: arcs up and over, back to centre
  { kind: "bow", bend: -0.32, dip: 0.02, z: 0.5 },
];
/** Phones: formations are centred and travel mostly vertically, so the pulls are smaller. */
const MOBILE_ROUTE = 0.45;
/** Phones turn a little less too, so the narrow column never shows the body edge-on for long. */
const MOBILE_SPIN = 0.6;
/** Phones keep their text under the formation, so flights barely sink: depth carries the dive. */
const MOBILE_SINK = 0.35;
/** Fixed per-boundary variation (+-10%) so the arcs are not all one size. Seeded, not timed. */
const routeJitter = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return 0.9 + 0.2 * (x - Math.floor(x));
};

/** Boundary k's route between two resting poses; every control point stays inside the view. */
export function travelRoute(
  k: number,
  from: Pose,
  to: Pose,
  view: { w: number; h: number; mobile: boolean },
): Route {
  const kk = Math.max(0, Math.min(ROUTE.length - 1, Math.floor(k)));
  const r = ROUTE[kk];
  const amt = routeJitter(kk) * (view.mobile ? MOBILE_ROUTE : 1);
  const cx = 0.4 * view.w;
  const cy = 0.5 * view.h;
  // never swing across centre into the text column of a formation that lives on one side
  const side = Math.sign(from.x + to.x);
  const lo = side > 0 ? 0 : -cx;
  const hi = side < 0 ? 0 : cx;
  const inView = (x: number, y: number, z: number): Vec3 => ({
    x: Math.max(lo, Math.min(hi, x)),
    y: Math.max(-cy, Math.min(cy, y)),
    z: Math.max(-1, Math.min(1, z)),
  });
  if (r.kind === "bow") {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // (-dy, dx) is the travel direction turned left; its length is the travel distance
    const c = inView(
      (from.x + to.x) / 2 - dy * r.bend * amt,
      (from.y + to.y) / 2 + dx * r.bend * amt + r.dip * amt * view.h,
      r.z * amt,
    );
    // the cubic that traces the quadratic through c: each control 2/3 of the way to it
    const toward = (p: Pose): Vec3 => ({
      x: p.x + ((c.x - p.x) * 2) / 3,
      y: p.y + ((c.y - p.y) * 2) / 3,
      z: (c.z * 2) / 3,
    });
    return { c1: toward(from), c2: toward(to), spinX: 0, spinY: 0, grow: 0 };
  }
  // outward is toward the edge of the formation's side (right when centred, as on phones)
  const out = side < 0 ? -1 : 1;
  const sink = view.mobile ? MOBILE_SINK : 1;
  const at = (p: Pose, [x, y, z]: [number, number, number]) =>
    inView(p.x + out * x * amt * view.w, p.y + (y < 0 ? y * sink : y) * amt * view.h, z * amt);
  const spin = routeJitter(kk) * (view.mobile ? MOBILE_SPIN : 1);
  return {
    c1: at(from, r.c1),
    c2: at(to, r.c2),
    spinX: r.spinX * spin,
    spinY: r.spinY * spin,
    grow: r.grow * (view.mobile ? MOBILE_ROUTE : 1),
  };
}

/** Frame-rate independent ease of `shown` toward `target`; dt in seconds. */
export const easeToward = (shown: number, target: number, dt: number, rate = 5) =>
  shown + (target - shown) * (1 - Math.exp(-dt * rate));

/**
 * The stream points ride between two shapes (see SignalPoints). `flow` 0..1 is how strongly a
 * boundary runs it: the intro -> wave fall is the showpiece, later boundaries get a calmer one.
 * `energy` 0..1 is how fast the morph is being scrolled: fast scrolls stir the stream up and
 * string it out, a slow or stopped scroll leaves calm ribbons.
 */
const BOUNDARY_FLOW = [1, 0.42, 0.42, 0.42, 0.42, 0.42];
export const flowStrength = (boundary: number) =>
  BOUNDARY_FLOW[Math.max(0, Math.min(BOUNDARY_FLOW.length - 1, Math.floor(boundary)))];

/** Morph speed (shape-index units per second) that reads as full energy. */
const FULL_ENERGY_SPEED = 3;
/**
 * Low-passed, clamped scroll energy from the change `ds` in shape index over `dt` seconds. Rises
 * fast and falls slowly, so a burst of scroll does not pop and a stop settles over a second or so.
 */
export function streamEnergy(shown: number, ds: number, dt: number): number {
  if (!(dt > 0) || !Number.isFinite(ds)) return shown;
  const raw = Math.min(1, Math.abs(ds) / dt / FULL_ENERGY_SPEED);
  return easeToward(shown, raw, Math.min(dt, 0.1), raw > shown ? 6 : 1.8);
}

/** Base morph stagger (share of the morph the last point waits), as before the stream. */
export const BASE_LAG = 0.7;
/** Stagger for a given flow and energy: fast scrolls string the points out along their paths. */
export const streamLag = (flow: number, energy: number) =>
  BASE_LAG + 0.5 * Math.min(1, Math.max(0, flow)) * Math.min(1, Math.max(0, energy));
