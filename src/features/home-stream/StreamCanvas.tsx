"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { profile } from "@/content/profile";
import { sampleText } from "@/features/signal-scene/glyph";
import {
  CAMERA,
  type Drive,
  type DriveFn,
  LENS,
  SignalPoints,
  type SiteFrame,
  type TextMask,
} from "@/features/signal-scene/SignalPoints";
import { heroShapes } from "@/features/signal-scene/shapes";
import {
  breathe,
  CAM_Z,
  CHAPTERS,
  chapterPose,
  easeToward,
  FOV,
  flowMix,
  flowStrength,
  shapeIndex,
  travelRoute,
  WAVE_CHAPTER,
} from "@/features/signal-scene/timeline";
import { lowPower } from "@/features/signal-scene/useSignalGate";
import { useThemeColors } from "@/lib/use-theme-colors";
import { measureLayout } from "./measure";
import type { HeroLink } from "./store";
import {
  createWave,
  flowAttributes,
  LINES,
  MARGIN,
  ROWS,
  SPRITE,
  SPRITES,
  stepWave,
  type WaveLayout,
  type WaveState,
} from "./waveDriver";

interface Props {
  /** the live hero; null while the canvas fades out after leaving home (the frame is held) */
  hero: HeroLink | null;
  count: number;
  frameloop: "always" | "never";
}

/** The home canvas (three + shaders): loaded with next/dynamic, client only. */
export default function StreamCanvas({ hero, count, frameloop }: Props) {
  const mobile = useMemo(lowPower, []);
  return (
    <Canvas
      dpr={mobile ? [1, 1.25] : [1, 1.75]}
      camera={CAMERA}
      frameloop={frameloop}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Stream hero={hero} count={count} />
    </Canvas>
  );
}

/** World size of the view on the z = 0 plane. */
const viewAt = (w: number, h: number) => {
  const vh = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
  return { w: (vh * w) / h, h: vh };
};

function Stream({ hero, count }: { hero: HeroLink | null; count: number }) {
  const heroRef = useRef(hero);
  heroRef.current = hero;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [samples, setSamples] = useState<Float32Array | null>(null);

  useEffect(() => {
    let live = true;
    sampleText(profile.name).then((s) => live && setSamples(s));
    return () => {
      live = false;
    };
  }, []);

  const shapes = useMemo(() => (samples ? heroShapes(count, samples) : null), [samples, count]);
  const siteAttr = useMemo(() => flowAttributes(count), [count]);
  const wave = useMemo(() => createWave(), []);
  const spine = useMemo(() => {
    const t = new THREE.DataTexture(wave.table, ROWS, LINES, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, [wave]);
  useEffect(() => () => spine.dispose(), [spine]);

  // layout: on mount, resize, content and font changes; never per frame
  const layout = useRef<WaveLayout | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: hero and size are the triggers
  useEffect(() => {
    if (!hero) return;
    let raf = 0;
    const run = () => {
      layout.current =
        measureLayout(sizeRef.current.width, sizeRef.current.height) ?? layout.current;
      invalidate();
    };
    const soon = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    };
    run();
    const late = window.setTimeout(run, 500);
    const ro = new ResizeObserver(soon);
    ro.observe(document.body);
    document.fonts?.ready.then(soon);
    window.addEventListener("load", soon);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      ro.disconnect();
      window.removeEventListener("load", soon);
    };
  }, [hero, size.width, size.height, invalidate]);

  const mask = useRef<TextMask>({ x: 0, y: 0, w: 0, h: 0, a: 0 });
  const live = useRef({ site: 0, last: -1, held: null as (Drive & { site?: SiteFrame }) | null });
  const drive: DriveFn = useCallback(
    (elapsed, view) => {
      const k = live.current;
      const h = heroRef.current;
      // leaving home: hold the last frame while it fades out
      if (!h && k.held) return k.held;
      const first = k.last < 0;
      const dt = first ? 0 : Math.min(0.1, Math.max(0, elapsed - k.last));
      k.last = elapsed;
      const p = h?.progressRef.current ?? 1;
      const stage = h?.stageRef.current?.getBoundingClientRect();
      // past the hero the stage scrolls away: all stream, whatever the eased progress says
      const target = !stage || stage.top < -1 ? 1 : flowMix(p);
      const s = shapeIndex(p);
      const i = Math.min(Math.floor(s), CHAPTERS - 2);
      const b = breathe(elapsed);
      const from = chapterPose(i, view);
      const to = chapterPose(i + 1, view);
      from.scale *= b;
      to.scale *= b;
      // the mask is in stage NDC; the canvas is as tall as the large viewport and stays put
      // while the stage scrolls away, so shift and scale it into canvas NDC
      const m = h?.maskRef.current;
      const H = sizeRef.current.height || 1;
      const ratio = stage ? stage.height / H : 1;
      const top = stage ? (2 * stage.top) / H : 0;
      Object.assign(mask.current, {
        x: m?.x ?? 0,
        y: 1 - (1 - (m?.y ?? 0)) * ratio - top,
        w: m?.w ?? 0,
        h: (m?.h ?? 0) * ratio,
        a: m?.a ?? 0,
      });
      // first frame (e.g. a reload mid-page) starts where it is; after that every change eases
      k.site = first ? target : easeToward(k.site, target, dt, 6);
      const L = layout.current;
      if (L) {
        stepWave(wave, L, window.scrollY, dt, { packets: true, flow: k.site });
        spine.needsUpdate = true;
      }
      k.held = {
        s,
        from,
        to,
        route: travelRoute(i, from, to, view),
        site: {
          amount: k.site,
          spine,
          rows: ROWS,
          lines: LINES,
          margin: MARGIN,
          band: wave.band,
          off: wave.off,
          swirl: wave.swirl,
          alpha: L ? Math.min(1, Math.max(0.45, 7000 / count)) : 0,
        },
      };
      return k.held;
    },
    [wave, spine, count],
  );

  const interactive =
    typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches;
  if (!shapes) return null;
  return (
    <>
      <SignalPoints
        maskRef={mask}
        shapes={shapes}
        count={count}
        drive={drive}
        waveShape={WAVE_CHAPTER}
        flow={flowStrength}
        siteAttr={siteAttr}
        interactive={interactive}
      />
      <Packets wave={wave} interactive={interactive} />
    </>
  );
}

const PACKET_VERT = /* glsl */ `
uniform float uDpr;
attribute float aSize;
attribute float aAlpha;
attribute float aKind;
varying float vA, vKind;
void main(){
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uDpr;
  vA = aAlpha;
  vKind = aKind;
}`;

const PACKET_FRAG = /* glsl */ `
uniform vec3 uGold, uText;
uniform float uDark;
varying float vA, vKind;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float glow = vKind > 0.5 && vKind < 1.5 ? 1.0 : 0.0;
  float disc = mix(1.0 - smoothstep(0.55, 1.0, d), pow(max(0.0, 1.0 - d), 1.6), uDark);
  float a = vA * mix(disc, pow(max(0.0, 1.0 - d), 2.2) * mix(0.5, 1.0, uDark), glow);
  if (a < 0.005) discard;
  vec3 flash = mix(uGold, mix(vec3(1.0), uText, 1.0 - uDark), 0.6);
  vec3 col = vKind < 1.5 ? uGold : vKind < 2.5 ? flash : uText;
  gl_FragColor = vec4(col, a);
}`;

/** Gold packets and the end glow: a few hundred CPU-placed sprites over the stream. */
function Packets({ wave, interactive }: { wave: WaveState; interactive: boolean }) {
  const { colors, mood } = useThemeColors();
  const dark = mood === "dark";
  const gl = useThree((s) => s.gl);
  // the same cursor lens as the stream points: packets bend round it and brighten
  const lens = useRef({ x: 0, y: 0, tx: 0, ty: 0, on: false, k: 0 });
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPRITES * 3), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(SPRITES), 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(SPRITES), 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(SPRITES), 1));
    g.setDrawRange(0, 0);
    const m = new THREE.ShaderMaterial({
      vertexShader: PACKET_VERT,
      fragmentShader: PACKET_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uDpr: { value: 1 },
        uDark: { value: 1 },
        uGold: { value: new THREE.Color() },
        uText: { value: new THREE.Color() },
      },
    });
    return { geometry: g, material: m };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useEffect(() => {
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  }, [dark, material]);

  useEffect(() => {
    if (!interactive) return;
    const move = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      const l = lens.current;
      l.tx = e.clientX - r.left;
      l.ty = e.clientY - r.top;
      l.on = l.tx >= 0 && l.tx <= r.width && l.ty >= 0 && l.ty <= r.height;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [gl, interactive]);

  useFrame((state, dt) => {
    const u = material.uniforms;
    const l = lens.current;
    if (l.on && l.k < 0.01) {
      l.x = l.tx;
      l.y = l.ty;
    } else {
      l.x += (l.tx - l.x) * (1 - Math.exp(-dt * 16));
      l.y += (l.ty - l.y) * (1 - Math.exp(-dt * 16));
    }
    l.k += ((l.on ? 1 : 0) - l.k) * (1 - Math.exp(-dt * 6));
    u.uDpr.value = state.viewport.dpr;
    u.uDark.value = dark ? 1 : 0;
    u.uGold.value.copy(dark ? colors.accent : colors.accentStrong);
    u.uText.value.copy(colors.text);
    const { width: W, height: H } = state.size;
    const view = viewAt(W, H);
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const size = geometry.getAttribute("aSize") as THREE.BufferAttribute;
    const alpha = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    const kind = geometry.getAttribute("aKind") as THREE.BufferAttribute;
    const s = wave.sprites;
    for (let i = 0; i < wave.spriteCount; i++) {
      const o = i * 5;
      let x = s[o];
      let y = s[o + 1];
      let sz = s[o + 2];
      let a = s[o + 3];
      if (l.k > 0.001 && s[o + 4] !== SPRITE.glow) {
        const dx = x - l.x;
        const dy = y - l.y;
        const d = Math.hypot(dx, dy) + 1e-3;
        const f = Math.max(0, 1 - d / LENS.r) * l.k;
        x += (dx / d) * f * f * LENS.push;
        y += (dy / d) * f * f * LENS.push;
        a = Math.min(1, a + f * LENS.glow);
        sz *= 1 + f * LENS.grow;
      }
      pos.setXYZ(i, (x / W - 0.5) * view.w, (0.5 - y / H) * view.h, 0);
      size.setX(i, sz);
      // the light theme gets a touch more ink so gold reads on a pale page
      alpha.setX(i, s[o + 4] === SPRITE.glow ? a : Math.min(1, a * (dark ? 1 : 1.1)));
      kind.setX(i, s[o + 4]);
    }
    for (const a of [pos, size, alpha, kind]) a.needsUpdate = true;
    geometry.setDrawRange(0, wave.spriteCount);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
