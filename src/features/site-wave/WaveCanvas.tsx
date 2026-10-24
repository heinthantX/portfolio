"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { profile } from "@/content/profile";
import { sampleText } from "@/features/signal-scene/glyph";
import {
  CAMERA,
  type DriveFn,
  SignalPoints,
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
  type Pose,
  shapeIndex,
  WAVE_CHAPTER,
} from "@/features/signal-scene/timeline";
import { useThemeColors } from "@/lib/use-theme-colors";
import { measureLayout } from "./measure";
import { useHero } from "./store";
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
  count: number;
  frameloop: "always" | "never" | "demand";
  /** reduced motion: one still frame, redrawn on resize and route change only */
  still: boolean;
  mobile: boolean;
}

/** The site canvas (three + shaders): loaded with next/dynamic, client only. */
export default function WaveCanvas({ count, frameloop, still, mobile }: Props) {
  return (
    <Canvas
      dpr={mobile ? [1, 1.25] : [1, 1.75]}
      camera={CAMERA}
      frameloop={frameloop}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Wave count={count} still={still} />
    </Canvas>
  );
}

/** World size of the view on the z = 0 plane. */
const viewAt = (w: number, h: number) => {
  const vh = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
  return { w: (vh * w) / h, h: vh };
};

function Wave({ count, still }: { count: number; still: boolean }) {
  const hero = useHero();
  const heroRef = useRef(hero);
  heroRef.current = hero;
  const pathname = usePathname();
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
  const flowAttr = useMemo(() => flowAttributes(count), [count]);
  const wave = useMemo(() => createWave(), []);
  const spine = useMemo(() => {
    const t = new THREE.DataTexture(wave.table, ROWS, LINES, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, [wave]);
  useEffect(() => () => spine.dispose(), [spine]);

  // layout: on route change, resize, content and font changes; never per frame
  const layout = useRef<WaveLayout | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname and hero are the triggers
  useEffect(() => {
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
  }, [pathname, hero, size.width, size.height, invalidate]);

  const { colors } = useThemeColors();
  // still frames redraw when the theme's colours land
  // biome-ignore lint/correctness/useExhaustiveDependencies: colors is the trigger
  useEffect(() => invalidate(), [colors, invalidate]);

  const mask = useRef<TextMask>({ x: 0, y: 0, w: 0, h: 0, a: 0 });
  const live = useRef({
    flow: hero ? 0 : 1,
    last: -1,
    s: 0,
    from: null as Pose | null,
    to: null as Pose | null,
  });
  const drive: DriveFn = useCallback(
    (elapsed, view) => {
      const k = live.current;
      const dt = k.last < 0 ? 0 : Math.min(0.1, elapsed - k.last);
      k.last = elapsed;
      const h = heroRef.current;
      let target = 1;
      if (h) {
        const p = h.progressRef.current ?? 0;
        const stage = h.stageRef.current?.getBoundingClientRect();
        // past the section the stage scrolls away: all flow, whatever the eased progress says
        target = stage && stage.top < -1 ? 1 : flowMix(p);
        k.s = shapeIndex(p);
        const i = Math.min(Math.floor(k.s), CHAPTERS - 2);
        const b = breathe(elapsed);
        k.from = chapterPose(i, view);
        k.to = chapterPose(i + 1, view);
        k.from.scale *= b;
        k.to.scale *= b;
        // the mask is in stage NDC; the canvas is as tall as the large viewport
        const m = h.maskRef.current;
        const ratio = stage ? stage.height / sizeRef.current.height : 1;
        Object.assign(mask.current, {
          x: m.x,
          y: 1 - (1 - m.y) * ratio,
          w: m.w,
          h: m.h * ratio,
          a: m.a * (1 - target),
        });
      } else mask.current.a = 0;
      k.flow = still ? target : easeToward(k.flow, target, dt, 6);
      const L = layout.current;
      if (L) {
        stepWave(wave, L, window.scrollY, still ? 0 : dt, { packets: !still, flow: k.flow });
        spine.needsUpdate = true;
      }
      const from = k.from ?? chapterPose(0, view);
      return {
        s: k.s,
        from,
        to: k.to ?? from,
        flow: {
          amount: k.flow,
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
    },
    [still, wave, spine, count],
  );

  if (!shapes) return null;
  return (
    <>
      <SignalPoints
        maskRef={mask}
        shapes={shapes}
        count={count}
        drive={drive}
        waveShape={WAVE_CHAPTER}
        flowAttr={flowAttr}
        still={still}
        interactive={
          typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches
        }
      />
      <Packets wave={wave} />
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
function Packets({ wave }: { wave: WaveState }) {
  const { colors, mood } = useThemeColors();
  const dark = mood === "dark";
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

  useFrame((state) => {
    const u = material.uniforms;
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
      pos.setXYZ(i, (s[o] / W - 0.5) * view.w, (0.5 - s[o + 1] / H) * view.h, 0);
      size.setX(i, s[o + 2]);
      // the light theme gets a touch more ink so gold reads on a pale page
      alpha.setX(i, s[o + 4] === SPRITE.glow ? s[o + 3] : Math.min(1, s[o + 3] * (dark ? 1 : 1.1)));
      kind.setX(i, s[o + 4]);
    }
    for (const a of [pos, size, alpha, kind]) a.needsUpdate = true;
    geometry.setDrawRange(0, wave.spriteCount);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
