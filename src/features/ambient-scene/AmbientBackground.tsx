"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { variantForPath } from "./variant";

const AmbientCanvas = dynamic(() => import("./AmbientCanvas"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function AmbientBackground() {
  const variant = variantForPath(usePathname());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!variant || ready) return;
    // Decoration only: start three.js after the page has loaded and gone idle, off the LCP path.
    let idle = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = () => hasWebGL() && setReady(true);
    const schedule = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(go, { timeout: 4000 });
      else timer = setTimeout(go, 300);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [variant, ready]);

  if (!variant || !ready) return null;
  return (
    <div aria-hidden className="ambient-mask no-print pointer-events-none fixed inset-0 -z-10">
      <AmbientCanvas variant={variant} />
    </div>
  );
}
