"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThemeColors } from "@/lib/use-theme-colors";
import type { Pose } from "./timeline";

export interface Drive {
  /** continuous shape index (integer = resting on that shape) */
  s: number;
  pose: Pose;
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

const VERT = /* glsl */ `
uniform float uT, uTime, uSize, uStrength, uRadius, uDark, uAlpha;
uniform vec3 uMouse, uText, uSignal, uMuted;
uniform vec4 uMask; // centre.xy, half-size.xy in NDC
uniform float uMaskA;
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aRand;
varying vec3 vColor;
varying float vA;
${NOISE}
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
  // cursor pushes points outward
  vec3 d = p - uMouse; d.z *= 0.5;
  float push = smoothstep(uRadius, 0.0, length(d)) * uStrength;
  p += normalize(d + 1e-4) * push * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  gl_PointSize = max(uSize * (0.55 + aRand * 0.9) / depth, 1.4);
  // thin out points that sit behind the active text block (soft edge)
  vec2 nd = gl_Position.xy / gl_Position.w;
  vec2 qm = abs(nd - uMask.xy) - uMask.zw;
  float away = smoothstep(0.0, 0.22, length(max(qm, 0.0)));
  float keep = mix(1.0, mix(0.04, 1.0, away), uMaskA);
  float sig = step(fract(aRand * 91.7), 0.3);
  float far = smoothstep(5.0, 9.2, depth);
  vColor = mix(mix(uText, uSignal, sig), uMuted, far * 0.5);
  float fade = mix(1.0, mix(1.0, 0.45, far), uDark);
  vA = uAlpha * (0.55 + 0.45 * fract(aRand * 53.1)) * fade * (1.0 + sig * 0.25 * uDark) * keep;
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

interface Props {
  /** At least two shapes (Float32Array of n*3 each). */
  shapes: Float32Array[];
  count: number;
  drive: DriveFn;
  /** pointer repulsion enabled (off on touch) */
  interactive?: boolean;
  maskRef?: RefObject<TextMask>;
}

export function SignalPoints({ shapes, count, drive, interactive = true, maskRef }: Props) {
  const { colors, mood } = useThemeColors();
  const dark = mood === "dark";
  const group = useRef<THREE.Group>(null);
  const seg = useRef(-1);
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const gl = useThree((s) => s.gl);

  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aFrom", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const rnd = new Float32Array(count);
    let a = 12345;
    for (let i = 0; i < count; i++) {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      rnd[i] = a / 4294967296;
    }
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
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
        uRadius: { value: 0.9 },
        uDark: { value: 1 },
        uAlpha: { value: 0.8 },
        uMouse: { value: v(99, 99, 0) },
        uText: { value: v(1, 1, 1) },
        uSignal: { value: v(1, 0.7, 0.2) },
        uMuted: { value: v(0.5, 0.5, 0.5) },
        uMask: { value: new THREE.Vector4(0, 0, 0, 0) },
        uMaskA: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // shapes changed (e.g. glyph arrived): force a buffer copy on the next frame
  // biome-ignore lint/correctness/useExhaustiveDependencies: shapes is the trigger
  useEffect(() => {
    seg.current = -1;
  }, [shapes]);

  useEffect(() => {
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  }, [dark, material]);

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
    const { s, pose } = drive(state.clock.elapsedTime, view);
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
    }
    u.uT.value = t;
    u.uTime.value = state.clock.elapsedTime;

    const g = group.current;
    if (g) {
      g.position.set(pose.x, pose.y, 0);
      g.rotation.set(pose.rotX, pose.rotY, 0);
      g.scale.setScalar(pose.scale);
      g.updateMatrixWorld();
    }

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

    // size: world point size -> pixels, scaled with the formation
    const worldSize = dark ? 0.022 : 0.026;
    u.uSize.value =
      (worldSize * state.size.height * state.viewport.dpr * pose.scale) /
      (2 * Math.tan((FOV * Math.PI) / 360));

    const mk = maskRef?.current;
    if (mk) {
      u.uMask.value.set(mk.x, mk.y, mk.w, mk.h);
      u.uMaskA.value += (mk.a - u.uMaskA.value) * (1 - Math.exp(-dt * 10));
    }

    // cursor on the formation plane, in local space
    const want = interactive && pointer.current.inside ? 1 : 0;
    u.uStrength.value += (want - u.uStrength.value) * (1 - Math.exp(-dt * 6));
    if (want) {
      raycaster.setFromCamera(
        new THREE.Vector2(pointer.current.x, pointer.current.y),
        state.camera,
      );
      if (raycaster.ray.intersectPlane(plane, tmp) && g) {
        g.worldToLocal(tmp);
        u.uMouse.value.copy(tmp);
      }
    }
    u.uRadius.value = 0.95 / Math.max(pose.scale, 0.1);
  });

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

export const CAMERA = { position: [0, 0, CAM_Z] as [number, number, number], fov: FOV };
