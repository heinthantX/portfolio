"use client";

import { useEffect, useRef, useState } from "react";

export function Cursor() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const fineMedia = window.matchMedia("(pointer: fine)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    const isSupported = () => fineMedia.matches && !motionMedia.matches;

    if (!isSupported()) {
      return;
    }

    setMounted(true);

    const onMediaChange = () => {
      setMounted(isSupported());
    };

    fineMedia.addEventListener?.("change", onMediaChange);
    motionMedia.addEventListener?.("change", onMediaChange);

    return () => {
      fineMedia.removeEventListener?.("change", onMediaChange);
      motionMedia.removeEventListener?.("change", onMediaChange);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return <CursorImpl />;
}

function CursorImpl() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("has-cursor");

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) {
      return () => {
        document.documentElement.classList.remove("has-cursor");
      };
    }

    let targetX = 0;
    let targetY = 0;
    let ringX = 0;
    let ringY = 0;
    let currentScale = 1;
    let targetScale = 1;
    let hasMoved = false;
    let isVisible = false;
    let isOverInput = false;
    let isDown = false;
    let downTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentMagnetic: HTMLElement | null = null;
    let magneticOffset = { x: 0, y: 0 };
    let rafId: number | null = null;

    const setVisible = (visible: boolean) => {
      isVisible = visible;
      const opacity = visible && !isOverInput ? "1" : "0";
      dot.style.opacity = opacity;
      ring.style.opacity = opacity;
    };

    const getElement = (target: EventTarget | null): Element | null => {
      if (!target) return null;
      if (typeof Element !== "undefined" && target instanceof Element) return target;
      if (typeof Document !== "undefined" && target instanceof Document)
        return target.documentElement;
      return null;
    };

    const updateHoverState = (rawTarget: EventTarget | null) => {
      const target = getElement(rawTarget);
      if (!target) return;

      const inputEl = target.closest(
        "input, textarea, select, [contenteditable], [contenteditable='true']",
      );
      if (inputEl) {
        isOverInput = true;
        dot.style.opacity = "0";
        ring.style.opacity = "0";
        return;
      }

      if (isOverInput) {
        isOverInput = false;
        if (isVisible) {
          dot.style.opacity = "1";
          ring.style.opacity = "1";
        }
      }

      const cursorEl = target.closest("[data-cursor]");
      const cursorLabel = cursorEl?.getAttribute("data-cursor");

      if (cursorEl && cursorLabel) {
        targetScale = 1;
        currentScale = isDown ? 0.8 : 1;
        ring.style.width = "64px";
        ring.style.height = "64px";
        ring.classList.add("bg-signal/10");
        label.textContent = cursorLabel;
        label.style.opacity = "1";
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
        return;
      }

      const interactiveEl = target.closest("a, button, [role=button], [data-cursor]");
      if (interactiveEl) {
        targetScale = 1.8;
        currentScale = isDown ? 0.8 : 1.8;
        ring.style.width = "32px";
        ring.style.height = "32px";
        ring.classList.add("bg-signal/10");
        label.textContent = "";
        label.style.opacity = "0";
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
        return;
      }

      targetScale = 1;
      currentScale = isDown ? 0.8 : 1;
      ring.style.width = "32px";
      ring.style.height = "32px";
      ring.classList.remove("bg-signal/10");
      label.textContent = "";
      label.style.opacity = "0";
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
    };

    const resetMagnetic = () => {
      if (currentMagnetic) {
        currentMagnetic.style.transition = "transform 300ms";
        currentMagnetic.style.transform = "translate3d(0px, 0px, 0px)";
        currentMagnetic = null;
        magneticOffset = { x: 0, y: 0 };
      }
    };

    const updateMagnetic = (event: PointerEvent) => {
      const target = getElement(event.target);
      const magneticEl = target?.closest<HTMLElement>("[data-magnetic]") ?? null;

      if (currentMagnetic && currentMagnetic !== magneticEl) {
        resetMagnetic();
      }

      if (magneticEl) {
        currentMagnetic = magneticEl;
        const rect = magneticEl.getBoundingClientRect();
        const origLeft = rect.left - magneticOffset.x;
        const origTop = rect.top - magneticOffset.y;
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        const centerX = origLeft + halfW;
        const centerY = origTop + halfH;

        const deltaX =
          halfW > 0 ? Math.max(-6, Math.min(6, ((event.clientX - centerX) / halfW) * 6)) : 0;
        const deltaY =
          halfH > 0 ? Math.max(-6, Math.min(6, ((event.clientY - centerY) / halfH) * 6)) : 0;

        magneticOffset = { x: deltaX, y: deltaY };
        magneticEl.style.transition = "transform 150ms ease-out";
        magneticEl.style.transform = `translate3d(${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0)`;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      startLoop();
      // The dot is the real pointer position: move it right away, never a frame late.
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;

      if (!hasMoved) {
        hasMoved = true;
        ringX = targetX;
        ringY = targetY;
        dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
        setVisible(true);
      } else if (!isVisible) {
        setVisible(true);
      }

      // Hover state changes only on pointerover; per-move work is just the magnetic pull, and only over [data-magnetic].
      if (currentMagnetic || (event.target as Element | null)?.closest?.("[data-magnetic]")) {
        updateMagnetic(event);
      }
    };

    const onPointerOver = (event: PointerEvent) => {
      startLoop();
      updateHoverState(event.target as Element | null);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (currentMagnetic) {
        const related =
          typeof Node !== "undefined" && event.relatedTarget instanceof Node
            ? event.relatedTarget
            : null;
        if (!related || !currentMagnetic.contains(related)) {
          resetMagnetic();
        }
      }
    };

    const onPointerDown = () => {
      isDown = true;
      startLoop();
      currentScale = 0.8;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(0.8)`;
      if (downTimeout) clearTimeout(downTimeout);
      downTimeout = setTimeout(() => {
        isDown = false;
        startLoop();
      }, 150);
    };

    const onPointerUp = () => {
      isDown = false;
      startLoop();
      if (downTimeout) {
        clearTimeout(downTimeout);
        downTimeout = null;
      }
    };

    const onLeave = () => {
      setVisible(false);
      resetMagnetic();
    };

    let lastTime = performance.now();
    const loop = (now: number = performance.now()) => {
      // Same feel at 60 Hz and 120 Hz: per-frame factors are tuned for 60 fps and scaled by elapsed time.
      const frames = Math.min((now - lastTime) / (1000 / 60), 4);
      lastTime = now;
      const follow = 1 - (1 - 0.4) ** frames;
      ringX += (targetX - ringX) * follow;
      ringY += (targetY - ringY) * follow;

      const activeTargetScale = isDown ? 0.8 : targetScale;
      currentScale += (activeTargetScale - currentScale) * (1 - (1 - 0.25) ** frames);

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentScale.toFixed(4)})`;

      // Settled: stop the loop; pointer move / hover / press restarts it.
      const settled =
        Math.abs(targetX - ringX) < 0.1 &&
        Math.abs(targetY - ringY) < 0.1 &&
        Math.abs(activeTargetScale - currentScale) < 0.001;
      rafId = settled ? null : requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (rafId !== null || typeof window.requestAnimationFrame !== "function") return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(loop);
    };
    startLoop();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    // Chrome: raw pointer updates arrive earlier and more often, so the dot tracks the mouse tighter.
    const onRawUpdate = (event: Event) => {
      const { clientX, clientY } = event as PointerEvent;
      targetX = clientX;
      targetY = clientY;
      startLoop();
      dot.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
    };
    const hasRaw = "onpointerrawupdate" in window;
    if (hasRaw) window.addEventListener("pointerrawupdate", onRawUpdate, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      document.documentElement.classList.remove("has-cursor");
      if (
        rafId !== null &&
        typeof window !== "undefined" &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(rafId);
      }
      if (downTimeout) clearTimeout(downTimeout);
      resetMagnetic();

      window.removeEventListener("pointermove", onPointerMove);
      if (hasRaw) window.removeEventListener("pointerrawupdate", onRawUpdate);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="custom-cursor no-print pointer-events-none fixed top-0 left-0 z-[60] h-[6px] w-[6px] rounded-full bg-signal opacity-0 transition-opacity duration-150"
        style={{ willChange: "transform", opacity: 0 }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="custom-cursor no-print pointer-events-none fixed top-0 left-0 z-[60] flex h-8 w-8 items-center justify-center rounded-full border border-signal opacity-0 transition-[width,height,background-color] duration-200 ease-out"
        style={{ willChange: "transform", opacity: 0 }}
      >
        <span
          ref={labelRef}
          className="pointer-events-none rounded-full bg-bg/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal-strong select-none opacity-0 transition-opacity duration-150"
        />
      </div>
    </>
  );
}
