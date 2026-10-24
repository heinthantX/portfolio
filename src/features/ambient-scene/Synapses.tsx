"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createFiring, type FiringOptions } from "./firing";

/** The part of the ambient scene state the network reads. */
interface Tint {
  strong: THREE.Color;
  accent: THREE.Color;
  alpha: number;
  still: boolean;
}

/** Each link is drawn in short pieces so it can arc like lightning while a pulse crosses it. */
const PIECES = 6;

/**
 * Firing-neuron overlay for an ambient scene. `positions` (xyz per node, in the parent's units)
 * is read every frame, so nodes may move. Pulses run along the links with a bright head; the link
 * jags around the head, and nodes flash as they fire.
 */
export function Synapses({
  s,
  positions,
  edges,
  seed,
  options,
  boost,
  opacity = 1,
  nodeSize = 0.09,
}: {
  s: Tint;
  positions: Float32Array;
  edges: readonly (readonly [number, number])[];
  seed: number;
  options?: FiringOptions;
  /** extra firings per second for node i (e.g. near the cursor) */
  boost?: (i: number) => number;
  opacity?: number;
  nodeSize?: number;
}) {
  const nodes = positions.length / 3;
  const net = useMemo(() => {
    let a = seed >>> 0;
    const rng = () => {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      return a / 4294967296;
    };
    const f = createFiring(nodes, edges, rng, options);
    // start mid-activity instead of from a dead network
    for (let i = 0; i < 3; i++) f.fire(Math.floor(rng() * nodes));
    return f;
  }, [nodes, edges, seed, options]);

  const { lineGeo, pointGeo, lineMat, pointMat } = useMemo(() => {
    const lineGeo = new THREE.BufferGeometry();
    const v = edges.length * PIECES * 2;
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(v * 3), 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(v * 3), 3));
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nodes * 3), 3));
    pointGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nodes * 3), 3));
    const common = { vertexColors: true, transparent: true, depthWrite: false };
    return {
      lineGeo,
      pointGeo,
      lineMat: new THREE.LineBasicMaterial(common),
      pointMat: new THREE.PointsMaterial({ ...common, size: nodeSize }),
    };
  }, [edges, nodes, nodeSize]);

  useEffect(
    () => () => {
      lineGeo.dispose();
      pointGeo.dispose();
      lineMat.dispose();
      pointMat.dispose();
    },
    [lineGeo, pointGeo, lineMat, pointMat],
  );

  const tmp = useMemo(() => new THREE.Color(), []);
  // where on each link the strongest pulse is (-1: none), refreshed per frame
  const head = useMemo(() => new Float32Array(edges.length), [edges]);

  useFrame(({ clock }, dt) => {
    if (!s.still) net.step(Math.min(dt, 0.1), boost);
    lineMat.opacity = s.alpha * 0.85 * opacity;
    pointMat.opacity = Math.min(1, s.alpha * 1.3 * opacity);
    head.fill(-1);
    for (const p of net.pulses) head[p.edge] = p.dir === 1 ? p.t : 1 - p.t;
    const tick = Math.floor(clock.elapsedTime * 16);
    const lp = lineGeo.attributes.position as THREE.BufferAttribute;
    const lc = lineGeo.attributes.color as THREE.BufferAttribute;
    let v = 0;
    edges.forEach(([a, b], k) => {
      const ax = positions[a * 3];
      const ay = positions[a * 3 + 1];
      const az = positions[a * 3 + 2];
      const dx = positions[b * 3] - ax;
      const dy = positions[b * 3 + 1] - ay;
      const dz = positions[b * 3 + 2] - az;
      const len = Math.hypot(dx, dy) || 1;
      const h = head[k];
      for (let piece = 0; piece < PIECES; piece++) {
        for (const j of [piece, piece + 1]) {
          const f = j / PIECES;
          const near = h < 0 ? 0 : Math.exp(-(((f - h) * 4) ** 2));
          // jag sideways to the link, re-rolled 16x a second while the pulse is near
          const r = Math.sin((k * 97 + j * 13 + tick) * 12.9898) * 43758.5453;
          const jag = (r - Math.floor(r) - 0.5) * near * Math.sin(f * Math.PI) * 0.22 * len;
          lp.setXYZ(v, ax + dx * f - (dy / len) * jag, ay + dy * f + (dx / len) * jag, az + dz * f);
          const passed = h >= 0 && f < h ? Math.exp(-(h - f) * 5) * 0.35 : 0;
          tmp.copy(s.strong).lerp(s.accent, Math.min(1, near + passed));
          lc.setXYZ(v, tmp.r, tmp.g, tmp.b);
          v++;
        }
      }
    });
    lp.needsUpdate = true;
    lc.needsUpdate = true;
    const pp = pointGeo.attributes.position as THREE.BufferAttribute;
    const pc = pointGeo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < nodes; i++) {
      pp.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      tmp.copy(s.strong).lerp(s.accent, net.flash[i]);
      pc.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    pp.needsUpdate = true;
    pc.needsUpdate = true;
  });

  return (
    <>
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={pointGeo} material={pointMat} frustumCulled={false} />
    </>
  );
}
