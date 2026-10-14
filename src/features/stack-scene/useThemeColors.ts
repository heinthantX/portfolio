"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import * as THREE from "three";

export interface ThemeColors {
  bg: THREE.Color;
  surface: THREE.Color;
  line: THREE.Color;
  lineStrong: THREE.Color;
  text: THREE.Color;
  muted: THREE.Color;
  accent: THREE.Color;
  accentStrong: THREE.Color;
  ok: THREE.Color;
}

export type ThemeMood = "dark" | "light";

export interface UseThemeColorsResult {
  colors: ThemeColors;
  mood: ThemeMood;
}

const DEFAULT_DARK_COLORS: ThemeColors = {
  bg: new THREE.Color("#0B0D10"),
  surface: new THREE.Color("#12161B"),
  line: new THREE.Color("#232A33"),
  lineStrong: new THREE.Color("#3A4350"),
  text: new THREE.Color("#E6EAF0"),
  muted: new THREE.Color("#8B95A3"),
  accent: new THREE.Color("#E8A33D"),
  accentStrong: new THREE.Color("#F2B55A"),
  ok: new THREE.Color("#4CC38A"),
};

const DEFAULT_LIGHT_COLORS: ThemeColors = {
  bg: new THREE.Color("#F5F6F8"),
  surface: new THREE.Color("#ECEEF2"),
  line: new THREE.Color("#D5DAE1"),
  lineStrong: new THREE.Color("#787878"),
  text: new THREE.Color("#0F1217"),
  muted: new THREE.Color("#545D6A"),
  accent: new THREE.Color("#A8650F"),
  accentStrong: new THREE.Color("#8F560C"),
  ok: new THREE.Color("#1F8A55"),
};

let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

function cssColorToThreeColor(cssValue: string, fallback: THREE.Color): THREE.Color {
  const trimmed = cssValue.trim();
  if (!trimmed) {
    return fallback.clone();
  }

  if (typeof document === "undefined") {
    try {
      return new THREE.Color(trimmed);
    } catch {
      return fallback.clone();
    }
  }

  if (!helperCanvas) {
    helperCanvas = document.createElement("canvas");
    helperCanvas.width = 1;
    helperCanvas.height = 1;
    helperCtx = helperCanvas.getContext("2d", { willReadFrequently: true });
  }

  if (!helperCtx) {
    try {
      return new THREE.Color(trimmed);
    } catch {
      return fallback.clone();
    }
  }

  helperCtx.clearRect(0, 0, 1, 1);
  helperCtx.fillStyle = trimmed;
  helperCtx.fillRect(0, 0, 1, 1);
  const data = helperCtx.getImageData(0, 0, 1, 1).data;

  return new THREE.Color(data[0] / 255, data[1] / 255, data[2] / 255);
}

function readThemeColors(mood: ThemeMood): ThemeColors {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return mood === "light" ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS;
  }

  const computed = window.getComputedStyle(document.documentElement);
  const fallbacks = mood === "light" ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS;

  return {
    bg: cssColorToThreeColor(computed.getPropertyValue("--bg"), fallbacks.bg),
    surface: cssColorToThreeColor(computed.getPropertyValue("--surface"), fallbacks.surface),
    line: cssColorToThreeColor(computed.getPropertyValue("--line"), fallbacks.line),
    lineStrong: cssColorToThreeColor(
      computed.getPropertyValue("--line-strong"),
      fallbacks.lineStrong,
    ),
    text: cssColorToThreeColor(computed.getPropertyValue("--text"), fallbacks.text),
    muted: cssColorToThreeColor(computed.getPropertyValue("--muted"), fallbacks.muted),
    accent: cssColorToThreeColor(computed.getPropertyValue("--accent"), fallbacks.accent),
    accentStrong: cssColorToThreeColor(
      computed.getPropertyValue("--accent-strong"),
      fallbacks.accentStrong,
    ),
    ok: cssColorToThreeColor(computed.getPropertyValue("--ok"), fallbacks.ok),
  };
}

export function useThemeColors(): UseThemeColorsResult {
  const { resolvedTheme } = useTheme();
  const mood: ThemeMood = resolvedTheme === "light" ? "light" : "dark";

  const [colors, setColors] = useState<ThemeColors>(() =>
    mood === "light" ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS,
  );

  useEffect(() => {
    let rafId: number;

    // Re-read one requestAnimationFrame after the change
    rafId = window.requestAnimationFrame(() => {
      setColors(readThemeColors(mood));
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [mood]);

  return { colors, mood };
}
