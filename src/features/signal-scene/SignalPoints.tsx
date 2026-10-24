"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThemeColors } from "@/lib/use-theme-colors";
import { mulberry32, neuralNet, waveNet } from "./shapes";
import type { Pose } from "./timeline";

export interface Drive {
  /** continuous shape index (integer = resting on that shape) */
  s: number;
  /** resting poses of the shapes either side of `s` */
  from: Pose;
  to: Pose;
}
/** Screen rect (NDC centre + full size) of the active text block, and its strength 0..1. */
export interface TextMask {
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
}
export type DriveFn = (elapsed: number, view: { w: number; h: number; mobile: boolean }) => Drive;

const FOV = 38;
const CAM_Z = 7;
/** Seconds for the points to gather on first frame. */
const INTRO_S = 2.8;

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/** Live swell of the field: crests roll toward the camera, never sideways. */
const FIELD = /* glsl */ `
float swell(vec3 p){
  return 0.10 * sin(p.z * 2.4 - uTime * 0.6)
       + 0.07 * sin(p.x * 1.3) * sin(uTime * 0.45 + p.z)
       + 0.06 * snoise(vec3(p.x * 0.7, p.z * 0.7, uTime * 0.1));
}`;
/** Depth (0 far..1 near) that a network path's current has reached, given the path's phase. */
const PULSE = /* glsl */ `
float pulseHead(float phase){ return fract(uTime * 0.28 + phase) * 1.4 - 0.2; }`;

const VERT = /* glsl */ `
uniform float uT, uTime, uSize, uStrength, uRadius, uDark, uAlpha, uIntro;
uniform float uWaveA, uWaveB, uDissolve;
uniform mat4 uMatA, uMatB; // endpoint poses (local -> world)
uniform vec2 uScaleAB;
uniform vec3 uMouse, uText, uSignal, uMuted;
uniform vec4 uMask; // centre.xy, half-size.xy in NDC
uniform float uMaskA;
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aRand;
// network role of the point in the from / to shape: neuron 0|1, depth, pulse phase
attribute vec3 aNodeA;
attribute vec3 aNodeB;
varying vec3 vColor;
varying float vA;
${NOISE}
${FIELD}
${PULSE}
void main(){
  // per-point stagger so morphs ripple instead of moving in lockstep
  float st = clamp(uT * 1.7 - aRand * 0.7, 0.0, 1.0);
  float e = st * st * (3.0 - 2.0 * st);
  vec3 p = mix(aFrom, aTo, e);
  // curl-ish noise: strong mid-travel, a gentle shimmer at rest
  float amp = 0.014 + 1.0 * sin(st * 3.14159265);
  vec3 q = p * 0.65 + vec3(0.0, 0.0, uTime * 0.18);
  p += vec3(snoise(q), snoise(q + 31.4), snoise(q + 57.2)) * amp;
  p += sin(uTime * 1.3 + aRand * 40.0 + vec3(0.0, 2.1, 4.2)) * 0.006;
  // the field swells in place
  float wv = mix(uWaveA, uWaveB, e);
  if (wv > 0.0) p.y += wv * swell(p);
  // neurons glow at rest and flash as current reaches them; stray points crackle like static
  vec3 nd3 = e < 0.5 ? aNodeA : aNodeB;
  float node = nd3.x * smoothstep(0.6, 1.0, abs(2.0 * e - 1.0));
  float hd = pulseHead(nd3.z) - nd3.y;
  float flash = node * exp(-hd * hd * 500.0);
  float crackle = (1.0 - sin(st * 3.14159265))
    * step(mix(0.996, 0.992, wv), fract(aRand * 977.0 + floor(uTime * 3.0 + aRand * 5.0) * 0.618));
  float lit = max(max(node * mix(0.35, 0.55, wv), flash), crackle);
  // intro: points gather inward from a loose cloud, each with its own lag (a swarm, not a fade)
  float it = clamp(uIntro * 1.4 - aRand * 0.4, 0.0, 1.0);
  float ie = 1.0 - pow(1.0 - it, 3.0);
  if (uIntro < 1.0) {
    vec3 cloud = p * 1.8 + vec3(snoise(p + 11.0), snoise(p + 23.0), snoise(p + 37.0)) * 0.8;
    p = mix(cloud, p, ie);
  }
  // each point blends between the two endpoint poses on its own stagger, so a change of place
  // reads as the swarm regathering, never as the whole formation sliding
  vec3 w = mix((uMatA * vec4(p, 1.0)).xyz, (uMatB * vec4(p, 1.0)).xyz, e);
  float sc = mix(uScaleAB.x, uScaleAB.y, e);
  // leaving the field: points lift and thin mid-flight, then condense into the next shape
  float mid = sin(st * 3.14159265) * uDissolve;
  w.y += mid * 0.5;
  // cursor pushes points outward
  vec3 d = w - uMouse; d.z *= 0.5;
  float push = smoothstep(uRadius, 0.0, length(d)) * uStrength;
  w += normalize(d + 1e-4) * push * 0.5 * sc;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  // the field keeps one fine dot size at any scale, so phones get the same texture
  gl_PointSize = max(uSize * mix(sc, 0.95, wv) * (0.55 + aRand * 0.9) * (1.0 + node * 0.7 + flash * 1.4) / depth, 1.4);
  // thin out points that sit behind the active text block (soft edge)
  vec2 nd = gl_Position.xy / gl_Position.w;
  vec2 qm = abs(nd - uMask.xy) - uMask.zw;
  float away = smoothstep(0.0, 0.22, length(max(qm, 0.0)));
  float keep = mix(1.0, mix(0.04, 1.0, away), uMaskA);
  float sig = step(fract(aRand * 91.7), 0.3);
  float far = smoothstep(5.0, 9.2, depth);
  vColor = mix(mix(mix(uText, uSignal, sig), uMuted, far * 0.5), uSignal, lit);
  float fade = mix(1.0, mix(1.0, 0.45, far), uDark);
  vA = uAlpha * (0.55 + 0.45 * fract(aRand * 53.1)) * fade * (1.0 + sig * 0.25 * uDark) * keep * ie
     * (1.0 - mid * 0.85) * mix(1.0, smoothstep(3.15, 2.8, abs(p.x)), wv) * (1.0 + lit * 1.4);
}`;

/** A shape's network links: they ride the same shimmer, swell and pose as its points. Current
 * runs along them by depth, and a link arcs like lightning while the current crosses it. */
const LINE_VERT = /* glsl */ `
uniform float uT, uTime, uStrength, uRadius, uIntro, uMode, uSc, uWave;
uniform mat4 uMatW; // the shape's pose
uniform vec3 uMouse;
uniform vec4 uMask;
uniform float uMaskA;
attribute float aRand;   // the end point's own random, for the same shimmer
attribute float aLinkR;  // the later-arriving end of the link, for the morph stagger
attribute float aDepth;
attribute float aPhase;
attribute float aSub;    // 0..1 along the link
attribute vec3 aJit;     // direction this vertex jumps in when the link arcs
varying float vDepth, vPhase, vA;
${NOISE}
${FIELD}
${PULSE}
void main(){
  vec3 p = position;
  vec3 q = p * 0.65 + vec3(0.0, 0.0, uTime * 0.18);
  p += vec3(snoise(q), snoise(q + 31.4), snoise(q + 57.2)) * 0.014;
  p += sin(uTime * 1.3 + aRand * 40.0 + vec3(0.0, 2.1, 4.2)) * 0.006;
  p.y += uWave * swell(p);
  float hd = pulseHead(aPhase) - aDepth;
  float arc = exp(-hd * hd * 400.0) * sin(aSub * 3.14159265);
  p += aJit * snoise(vec3(aJit.xy * 7.0, floor(uTime * 16.0))) * arc * 0.08;
  vec3 w = (uMatW * vec4(p, 1.0)).xyz;
  vec3 d = w - uMouse; d.z *= 0.5;
  w += normalize(d + 1e-4) * smoothstep(uRadius, 0.0, length(d)) * uStrength * 0.5 * uSc;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  // links show only once both ends have landed, and go first when the field breaks up
  float st = clamp(uT * 1.7 - aLinkR * 0.7, 0.0, 1.0);
  float vis = uMode > 0.0 ? smoothstep(0.85, 1.0, st) : 1.0 - smoothstep(0.0, 0.1, st);
  vec2 nd = gl_Position.xy / gl_Position.w;
  vec2 qm = abs(nd - uMask.xy) - uMask.zw;
  float keep = mix(1.0, mix(0.04, 1.0, smoothstep(0.0, 0.22, length(max(qm, 0.0)))), uMaskA);
  vA = vis * keep * smoothstep(0.7, 1.0, uIntro) * smoothstep(3.15, 2.8, abs(position.x));
  vDepth = aDepth;
  vPhase = aPhase;
}`;

const LINE_FRAG = /* glsl */ `
uniform float uTime, uDark, uAlpha, uBase;
uniform vec3 uText, uSignal;
varying float vDepth, vPhase, vA;
${PULSE}
void main(){
  float d = pulseHead(vPhase) - vDepth; // > 0: the current has already passed here
  float glow = exp(-d * d * 900.0) + step(0.0, d) * exp(-d * 9.0) * 0.35;
  float flicker = 0.8 + 0.2 * sin(uTime * 37.0 + vPhase * 91.0);
  float a = vA * uAlpha * (uBase * mix(1.0, 0.7, uDark) + glow * flicker * 0.95);
  if (a < 0.005) discard;
  gl_FragColor = vec4(mix(uText, uSignal, min(1.0, 0.35 + glow)), a);
}`;

const FRAG = /* glsl */ `
uniform float uDark;
varying vec3 vColor;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float glow = pow(1.0 - smoothstep(0.0, 0.5, d), 1.7);
  float ink = 1.0 - smoothstep(0.3, 0.5, d);
  float a = mix(ink, glow, uDark) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

/** Links split into short pieces so they can arc; per-vertex depth, phase and jump direction. */
const PIECES = 5;
function linkGeometry(
  shape: Float32Array,
  pairs: Uint32Array,
  phase: Float32Array,
  node: Float32Array,
  rnd: Float32Array,
) {
  const links = pairs.length / 2;
  const verts = links * PIECES * 2;
  const pos = new Float32Array(verts * 3);
  const jit = new Float32Array(verts * 3);
  const own = new Float32Array(verts);
  const late = new Float32Array(verts);
  const depth = new Float32Array(verts);
  const ph = new Float32Array(verts);
  const sub = new Float32Array(verts);
  const r = mulberry32(99);
  let v = 0;
  for (let l = 0; l < links; l++) {
    const a = pairs[l * 2];
    const b = pairs[l * 2 + 1];
    // one jump direction per joint, shared by the two pieces that meet there
    const joints = Array.from({ length: PIECES + 1 }, () => [r() * 2 - 1, r() * 2 - 1, r() - 0.5]);
    for (let k = 0; k < PIECES; k++) {
      for (const j of [k, k + 1]) {
        const f = j / PIECES;
        for (let c = 0; c < 3; c++) {
          pos[v * 3 + c] = shape[a * 3 + c] + (shape[b * 3 + c] - shape[a * 3 + c]) * f;
          jit[v * 3 + c] = joints[j][c];
        }
        own[v] = f < 0.5 ? rnd[a] : rnd[b];
        late[v] = Math.max(rnd[a], rnd[b]);
        depth[v] = node[a * 3 + 1] + (node[b * 3 + 1] - node[a * 3 + 1]) * f;
        ph[v] = phase[l];
        sub[v] = f;
        v++;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aJit", new THREE.BufferAttribute(jit, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(own, 1));
  g.setAttribute("aLinkR", new THREE.BufferAttribute(late, 1));
  g.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
  g.setAttribute("aSub", new THREE.BufferAttribute(sub, 1));
  return g;
}

interface Props {
  /** At least two shapes (Float32Array of n*3 each). */
  shapes: Float32Array[];
  count: number;
  drive: DriveFn;
  /** pointer repulsion enabled (off on touch) */
  interactive?: boolean;
  maskRef?: RefObject<TextMask>;
  /** index in `shapes` of the swelling field, if any */
  waveShape?: number;
}

export function SignalPoints({
  shapes,
  count,
  drive,
  interactive = true,
  maskRef,
  waveShape = -1,
}: Props) {
  const { colors, mood } = useThemeColors();
  const dark = mood === "dark";
  const seg = useRef(-1);
  const lineRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const introStart = useRef(-1);
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const xf = useMemo(
    () => ({
      p: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      s: new THREE.Vector3(),
    }),
    [],
  );
  const gl = useThree((s) => s.gl);

  const rnd = useMemo(() => {
    const out = new Float32Array(count);
    let a = 12345;
    for (let i = 0; i < count; i++) {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      out[i] = a / 4294967296;
    }
    return out;
  }, [count]);

  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aFrom", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    g.setAttribute("aNodeA", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aNodeB", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uT: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 1 },
        uStrength: { value: 0 },
        uRadius: { value: 0.95 },
        uDark: { value: 1 },
        uAlpha: { value: 0.8 },
        uIntro: { value: 0 },
        uWaveA: { value: 0 },
        uWaveB: { value: 0 },
        uDissolve: { value: 0 },
        uMatA: { value: new THREE.Matrix4() },
        uMatB: { value: new THREE.Matrix4() },
        uScaleAB: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: v(99, 99, 0) },
        uText: { value: v(1, 1, 1) },
        uSignal: { value: v(1, 0.7, 0.2) },
        uMuted: { value: v(0.5, 0.5, 0.5) },
        uMask: { value: new THREE.Vector4(0, 0, 0, 0) },
        uMaskA: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [count, rnd]);

  // One network per shape (the wave's flows toward the viewer, the rest fire like neurons). Each
  // shares the points' uniform objects so the two stay in step.
  const nets = useMemo(
    () =>
      shapes.map((full, k) => {
        const shape = full.subarray(0, count * 3);
        const { pairs, phase, node } =
          k === waveShape ? waveNet(shape) : neuralNet(shape, 110, 2, 5 + k);
        const g = linkGeometry(shape, pairs, phase, node, rnd);
        const u = material.uniforms;
        const m = new THREE.ShaderMaterial({
          vertexShader: LINE_VERT,
          fragmentShader: LINE_FRAG,
          transparent: true,
          depthWrite: false,
          uniforms: {
            uT: u.uT,
            uTime: u.uTime,
            uStrength: u.uStrength,
            uRadius: u.uRadius,
            uIntro: u.uIntro,
            uMouse: u.uMouse,
            uMask: u.uMask,
            uMaskA: u.uMaskA,
            uDark: u.uDark,
            uAlpha: u.uAlpha,
            uText: u.uText,
            uSignal: u.uSignal,
            uWave: { value: k === waveShape ? 1 : 0 },
            uBase: { value: k === waveShape ? 0.16 : 0.09 },
            uMode: { value: 0 },
            uSc: { value: 1 },
            uMatW: { value: new THREE.Matrix4() },
          },
        });
        return { geometry: g, material: m, node };
      }),
    [shapes, waveShape, count, rnd, material],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useEffect(
    () => () => {
      for (const n of nets) {
        n.geometry.dispose();
        n.material.dispose();
      }
    },
    [nets],
  );

  // shapes changed (e.g. glyph arrived): force a buffer copy on the next frame
  // biome-ignore lint/correctness/useExhaustiveDependencies: shapes and nets are the trigger
  useEffect(() => {
    seg.current = -1;
  }, [shapes, nets]);

  useEffect(() => {
    for (const m of [material, ...nets.map((n) => n.material)]) {
      m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
  }, [dark, material, nets]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      pointer.current.inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [gl]);

  // eased colour targets (~450 ms)
  const cur = useRef({
    text: new THREE.Vector3(),
    signal: new THREE.Vector3(),
    muted: new THREE.Vector3(),
    dark: 1,
    alpha: 0.8,
    init: false,
  });

  useFrame((state, dt) => {
    const u = material.uniforms;
    const view = {
      w: (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360) * state.size.width) / state.size.height,
      h: 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360),
      mobile: state.size.width < 768,
    };
    const { s, from, to } = drive(state.clock.elapsedTime, view);
    const sMax = shapes.length - 1;
    const sg = Math.min(Math.floor(s), sMax - 1);
    const t = Math.min(1, Math.max(0, s - sg));
    if (sg !== seg.current) {
      seg.current = sg;
      const from = geometry.getAttribute("aFrom") as THREE.BufferAttribute;
      const to = geometry.getAttribute("aTo") as THREE.BufferAttribute;
      from.array.set(shapes[sg].subarray(0, count * 3));
      to.array.set(shapes[sg + 1].subarray(0, count * 3));
      from.needsUpdate = true;
      to.needsUpdate = true;
      for (const [name, k] of [
        ["aNodeA", sg],
        ["aNodeB", sg + 1],
      ] as const) {
        const a = geometry.getAttribute(name) as THREE.BufferAttribute;
        a.array.set(nets[k].node);
        a.needsUpdate = true;
      }
    }
    u.uT.value = t;
    u.uTime.value = state.clock.elapsedTime;
    if (introStart.current < 0) introStart.current = state.clock.elapsedTime;
    u.uIntro.value = Math.min(1, (state.clock.elapsedTime - introStart.current) / INTRO_S);

    const compose = (m: THREE.Matrix4, pose: Pose) =>
      m.compose(
        xf.p.set(pose.x, pose.y, 0),
        xf.q.setFromEuler(xf.e.set(pose.rotX, pose.rotY, 0)),
        xf.s.setScalar(pose.scale),
      );
    compose(u.uMatA.value, from);
    compose(u.uMatB.value, to);
    u.uScaleAB.value.set(from.scale, to.scale);
    u.uWaveA.value = sg === waveShape ? 1 : 0;
    u.uWaveB.value = sg + 1 === waveShape ? 1 : 0;
    u.uDissolve.value = sg === waveShape ? 1 : 0;
    // a shape's links live in its pose: arriving (it is `to`) or leaving (it is `from`)
    nets.forEach((n, k) => {
      const mode = k === sg ? -1 : k === sg + 1 ? 1 : 0;
      const line = lineRefs.current[k];
      if (line) line.visible = mode !== 0;
      if (mode === 0) return;
      const lu = n.material.uniforms;
      lu.uMode.value = mode;
      lu.uMatW.value.copy(mode < 0 ? u.uMatA.value : u.uMatB.value);
      lu.uSc.value = mode < 0 ? from.scale : to.scale;
    });

    // theme colours ease
    const c = cur.current;
    const accent = dark ? colors.accent : colors.accentStrong;
    const target = {
      text: [colors.text.r, colors.text.g, colors.text.b],
      signal: [accent.r, accent.g, accent.b],
      muted: [colors.muted.r, colors.muted.g, colors.muted.b],
    };
    const k = c.init ? 1 - Math.exp(-dt * 7) : 1;
    c.init = true;
    c.text.lerp(tmp.set(target.text[0], target.text[1], target.text[2]), k);
    c.signal.lerp(tmp.set(target.signal[0], target.signal[1], target.signal[2]), k);
    c.muted.lerp(tmp.set(target.muted[0], target.muted[1], target.muted[2]), k);
    c.dark += ((dark ? 1 : 0) - c.dark) * k;
    c.alpha += ((dark ? 0.6 : 0.62) - c.alpha) * k;
    u.uText.value.copy(c.text);
    u.uSignal.value.copy(c.signal);
    u.uMuted.value.copy(c.muted);
    u.uDark.value = c.dark;
    u.uAlpha.value = c.alpha;

    // size: world point size -> pixels; the shader scales it with each point's pose
    const worldSize = dark ? 0.022 : 0.02;
    u.uSize.value =
      (worldSize * state.size.height * state.viewport.dpr) / (2 * Math.tan((FOV * Math.PI) / 360));

    const mk = maskRef?.current;
    if (mk) {
      u.uMask.value.set(mk.x, mk.y, mk.w, mk.h);
      u.uMaskA.value += (mk.a - u.uMaskA.value) * (1 - Math.exp(-dt * 10));
    }

    // cursor on the z = 0 plane, in world space
    const want = interactive && pointer.current.inside ? 1 : 0;
    u.uStrength.value += (want - u.uStrength.value) * (1 - Math.exp(-dt * 6));
    if (want) {
      raycaster.setFromCamera(
        new THREE.Vector2(pointer.current.x, pointer.current.y),
        state.camera,
      );
      if (raycaster.ray.intersectPlane(plane, tmp)) u.uMouse.value.copy(tmp);
    }
  });

  return (
    <>
      {nets.map((n, k) => (
        <lineSegments
          // biome-ignore lint/suspicious/noArrayIndexKey: one network per shape, in shape order
          key={k}
          ref={(o) => {
            lineRefs.current[k] = o;
          }}
          geometry={n.geometry}
          material={n.material}
          frustumCulled={false}
          visible={false}
        />
      ))}
      <points geometry={geometry} material={material} frustumCulled={false} />
    </>
  );
}

export const CAMERA = { position: [0, 0, CAM_Z] as [number, number, number], fov: FOV };
