"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThemeColors } from "@/lib/use-theme-colors";
import type { AmbientVariant } from "./variant";

/** Mutable state shared with the scenes; nothing here triggers React renders. */
interface Shared {
  strong: THREE.Color;
  accent: THREE.Color;
  tStrong: THREE.Color;
  tAccent: THREE.Color;
  alpha: number;
  tAlpha: number;
  // pointer in -1..1 (raw + smoothed)
  x: number;
  y: number;
  sx: number;
  sy: number;
  low: boolean;
  moved: boolean;
  still: boolean;
}

function rngFrom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ease = (dt: number, k: number) => 1 - Math.exp(-dt * k);

function useDisposable<T extends { dispose(): void }>(make: () => T): T {
  const [obj] = useState(make);
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

/** Cursor in scene units (z=0 plane) plus the viewport size. */
function useCursor() {
  const size = { w: 1, h: 1, cx: 0, cy: 0 };
  return (s: Shared, vw: number, vh: number) => {
    size.w = vw;
    size.h = vh;
    size.cx = s.sx * vw * 0.5;
    size.cy = s.sy * vh * 0.5;
    return size;
  };
}

/* ---------- sheets: floating drawing-sheet frames ---------- */
function Sheets({ s }: { s: Shared }) {
  const n = s.low ? 3 : 5;
  const geo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    const w = Math.SQRT1_2;
    const h = 0.5;
    const i = 0.03;
    const t = 0.035;
    const rect = (x: number, y: number): number[] => [
      -x,
      -y,
      x,
      -y,
      x,
      -y,
      x,
      y,
      x,
      y,
      -x,
      y,
      -x,
      y,
      -x,
      -y,
    ];
    const v = [...rect(w, h), ...rect(w - i, h - i)];
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        v.push(sx * w, sy * h, sx * (w + t), sy * h, sx * w, sy * h, sx * w, sy * (h + t));
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        v.flatMap((c, k) => (k % 2 ? [c, 0] : [c])),
        3,
      ),
    );
    return g;
  });
  const mat = useDisposable(() => {
    const m = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    m.color = s.strong;
    return m;
  });
  const sheets = useMemo(() => {
    const r = rngFrom(7);
    return Array.from({ length: n }, (_, i) => ({
      w: 7 + r() * 5,
      x: (r() - 0.5) * 12,
      y: (r() - 0.5) * 7,
      z: -2 - i * 1.6,
      rot: (r() - 0.5) * 0.12,
      ph: r() * 6.28,
    }));
  }, [n]);
  const refs = useRef<(THREE.LineSegments | null)[]>([]);

  useFrame(({ clock }) => {
    mat.opacity = s.alpha * 0.5;
    const t = s.still ? 0 : clock.elapsedTime;
    sheets.forEach((sh, i) => {
      const o = refs.current[i];
      if (!o) return;
      o.position.set(
        sh.x + Math.sin(t * 0.05 + sh.ph) * 0.8,
        sh.y,
        sh.z + Math.sin(t * 0.08 + sh.ph) * 0.9,
      );
      o.rotation.z = sh.rot + Math.sin(t * 0.04 + sh.ph) * 0.02;
    });
  });

  return (
    <>
      {sheets.map((sh, i) => (
        <lineSegments
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          key={i}
          ref={(o) => {
            refs.current[i] = o;
          }}
          geometry={geo}
          material={mat}
          scale={[sh.w, sh.w, 1]}
        />
      ))}
    </>
  );
}

/* ---------- field: dot plane with wave + cursor ripple ---------- */
function Field({ s }: { s: Shared }) {
  const cols = s.low ? 24 : 40;
  const rows = s.low ? 14 : 24;
  const ref = useRef<THREE.Points>(null);
  const cursor = useCursor();
  const base = useMemo(() => {
    const b = new Float32Array(cols * rows * 2);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        b[(j * cols + i) * 2] = i / (cols - 1) - 0.5;
        b[(j * cols + i) * 2 + 1] = j / (rows - 1) - 0.5;
      }
    return b;
  }, [cols, rows]);
  const geo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cols * rows * 3), 3));
    return g;
  });
  const mat = useDisposable(() => {
    const m = new THREE.PointsMaterial({ size: 0.055, transparent: true, depthWrite: false });
    m.color = s.strong;
    return m;
  });

  useFrame(({ clock, viewport }) => {
    const o = ref.current;
    if (!o) return;
    mat.opacity = s.alpha * 1.0;
    const c = cursor(s, viewport.width * 1.15, viewport.height * 1.15);
    const t = s.still ? 0 : clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < cols * rows; k++) {
      const x = base[k * 2] * c.w;
      const y = base[k * 2 + 1] * c.h;
      let z = 0.14 * Math.sin(x * 0.7 + t * 0.6) * Math.cos(y * 0.6 + t * 0.45);
      if (s.moved) {
        const d2 = (x - c.cx) ** 2 + (y - c.cy) ** 2;
        if (d2 < 30)
          z +=
            Math.exp(-d2 / 1.8) * 0.8 +
            Math.sin(Math.sqrt(d2) * 3 - t * 3) * 0.2 * Math.exp(-d2 / 6);
      }
      pos.setXYZ(k, x, y, z);
    }
    pos.needsUpdate = true;
    o.position.z = -1;
  });

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}

/* ---------- graph: sparse service graph, edges light up near cursor ---------- */
function Graph({ s }: { s: Shared }) {
  const cursor = useCursor();
  const { nodes, edges } = useMemo(() => {
    const r = rngFrom(11);
    const cols = s.low ? 3 : 5;
    const rows = 3;
    const nodes: [number, number, number][] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        nodes.push([
          (i + 0.5) / cols - 0.5 + (r() - 0.5) * 0.12,
          (j + 0.5) / rows - 0.5 + (r() - 0.5) * 0.14,
          -r() * 2,
        ]);
    const seen = new Set<string>();
    const edges: [number, number][] = [];
    nodes.forEach((a, i) => {
      nodes
        .map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2] as const)
        .filter(([j]) => j !== i)
        .sort((p, q) => p[1] - q[1])
        .slice(0, 2)
        .forEach(([j]) => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push([i, j]);
          }
        });
    });
    return { nodes, edges };
  }, [s.low]);

  const lineGeo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        edges.flatMap(([a, b]) => [...nodes[a], ...nodes[b]]),
        3,
      ),
    );
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    return g;
  });
  const pointGeo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(nodes.flat(), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nodes.length * 3), 3));
    return g;
  });
  const lineMat = useDisposable(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }),
  );
  const pointMat = useDisposable(
    () =>
      new THREE.PointsMaterial({
        size: 0.11,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
      }),
  );
  const group = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ viewport }) => {
    const c = cursor(s, viewport.width * 0.9, viewport.height * 0.9);
    group.current?.scale.set(c.w, c.h, 1);
    lineMat.opacity = s.alpha * 0.8;
    pointMat.opacity = s.alpha * 1.2;
    const prox = nodes.map(([x, y]) => {
      if (!s.moved) return 0;
      const d = Math.hypot(x * c.w - c.cx, y * c.h - c.cy);
      return Math.max(0, 1 - d / 3.2);
    });
    const lc = lineGeo.attributes.color as THREE.BufferAttribute;
    edges.forEach(([a, b], k) => {
      tmp.copy(s.strong).lerp(s.accent, Math.max(prox[a], prox[b]) ** 1.2);
      lc.setXYZ(k * 2, tmp.r, tmp.g, tmp.b);
      lc.setXYZ(k * 2 + 1, tmp.r, tmp.g, tmp.b);
    });
    lc.needsUpdate = true;
    const pc = pointGeo.attributes.color as THREE.BufferAttribute;
    prox.forEach((p, i) => {
      tmp.copy(s.strong).lerp(s.accent, p);
      pc.setXYZ(i, tmp.r, tmp.g, tmp.b);
    });
    pc.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={pointGeo} material={pointMat} frustumCulled={false} />
    </group>
  );
}

/* ---------- packets: orthogonal routes, amber packets flowing right ---------- */
function Packets({ s }: { s: Shared }) {
  const routes = useMemo(() => {
    const r = rngFrom(23);
    const n = s.low ? 3 : 5;
    return Array.from({ length: n }, (_, i) => {
      const lane = (i / (n - 1) - 0.5) * 0.8;
      const y1 = lane + (r() - 0.5) * 0.25;
      const y2 = lane + (r() - 0.5) * 0.25;
      const x1 = -0.3 + r() * 0.2;
      const x2 = 0.1 + r() * 0.25;
      const pts: [number, number][] = [
        [-0.6, lane],
        [x1, lane],
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [0.6, y2],
      ];
      const lens = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
      return {
        pts,
        lens,
        total: lens.reduce((a, b) => a + b, 0),
        speed: 0.05 + r() * 0.04,
        off: r(),
      };
    });
  }, [s.low]);
  const per = 2;
  const group = useRef<THREE.Group>(null);
  const cursor = useCursor();
  const lineGeo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        routes.flatMap((rt) => rt.pts.slice(1).flatMap((p, k) => [...rt.pts[k], 0, ...p, 0])),
        3,
      ),
    );
    return g;
  });
  const pGeo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(routes.length * per * 3), 3),
    );
    return g;
  });
  const lineMat = useDisposable(() => {
    const m = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    m.color = s.strong;
    return m;
  });
  const pMat = useDisposable(() => {
    const m = new THREE.PointsMaterial({ size: 0.16, transparent: true, depthWrite: false });
    m.color = s.accent;
    return m;
  });

  useFrame(({ clock, viewport }) => {
    const c = cursor(s, viewport.width, viewport.height);
    group.current?.scale.set(c.w, c.h, 1);
    lineMat.opacity = s.alpha * 0.55;
    pMat.opacity = Math.min(1, s.alpha * 1.6);
    const t = s.still ? 0 : clock.elapsedTime;
    const pos = pGeo.attributes.position as THREE.BufferAttribute;
    routes.forEach((rt, i) => {
      for (let k = 0; k < per; k++) {
        let d = ((((t * rt.speed + rt.off + k / per) % 1) + 1) % 1) * rt.total;
        let seg = 0;
        while (seg < rt.lens.length - 1 && d > rt.lens[seg]) d -= rt.lens[seg++];
        const f = d / rt.lens[seg];
        const a = rt.pts[seg];
        const b = rt.pts[seg + 1];
        pos.setXYZ(i * per + k, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0);
      }
    });
    pos.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={pGeo} material={pMat} frustumCulled={false} />
    </group>
  );
}

/* ---------- rig: theme easing, cursor tilt, scroll parallax ---------- */
function Rig({ s, children }: { s: Shared; children: ReactNode }) {
  const { colors, mood } = useThemeColors();
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((st) => st.invalidate);

  useEffect(() => {
    s.tStrong.copy(colors.lineStrong);
    s.tAccent.copy(colors.accent);
    s.tAlpha = (mood === "light" ? 0.65 : 0.75) * (s.low ? 0.7 : 1);
    if (s.still) {
      s.strong.copy(s.tStrong);
      s.accent.copy(s.tAccent);
      s.alpha = s.tAlpha;
      invalidate();
    }
  }, [colors, mood, s, invalidate]);

  useFrame((_, dt) => {
    const k = ease(Math.min(dt, 0.1), 5);
    s.strong.lerp(s.tStrong, k);
    s.accent.lerp(s.tAccent, k);
    s.alpha += (s.tAlpha - s.alpha) * k;
    const g = group.current;
    if (!g || s.still) return;
    const p = ease(Math.min(dt, 0.1), 4);
    s.sx += (s.x - s.sx) * p;
    s.sy += (s.y - s.sy) * p;
    g.rotation.y = s.sx * 0.07;
    g.rotation.x = -s.sy * 0.05;
    g.position.y = Math.min(window.scrollY, 4000) * 0.0015;
  });

  return <group ref={group}>{children}</group>;
}

export default function AmbientCanvas({ variant }: { variant: AmbientVariant }) {
  const [hidden, setHidden] = useState(false);
  const s = useMemo<Shared>(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const low = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    return {
      strong: new THREE.Color("#3A4350"),
      accent: new THREE.Color("#E8A33D"),
      tStrong: new THREE.Color("#3A4350"),
      tAccent: new THREE.Color("#E8A33D"),
      alpha: 0.75,
      tAlpha: 0.75,
      x: 0,
      y: 0,
      sx: 0,
      sy: 0,
      low,
      moved: false,
      still,
    };
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    const onMove = (e: PointerEvent) => {
      s.moved = true;
      s.x = (e.clientX / window.innerWidth) * 2 - 1;
      s.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    document.addEventListener("visibilitychange", onVis);
    if (!s.still) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
    };
  }, [s]);

  const Scene = { sheets: Sheets, field: Field, graph: Graph, packets: Packets }[variant];

  return (
    <Canvas
      frameloop={s.still ? "demand" : hidden ? "never" : "always"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 10], fov: 45 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
    >
      <Rig s={s}>
        <Scene s={s} />
      </Rig>
    </Canvas>
  );
}
