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
    const go = () => hasWebGL() && setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 300);
    return () => clearTimeout(id);
  }, [variant, ready]);

  if (!variant || !ready) return null;
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10">
      <AmbientCanvas variant={variant} />
    </div>
  );
}
