"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useSignalGate } from "./useSignalGate";

const SignalCanvas = dynamic(() => import("./SignalCanvas"), { ssr: false });

/** Stand-alone Signal scene. "not-found": points form "404", scatter and reform; the cursor repels. */
export function SignalScene({ variant = "not-found" }: { variant?: "hero" | "not-found" }) {
  const ref = useRef<HTMLDivElement>(null);
  const gate = useSignalGate(ref);
  return (
    <div ref={ref} aria-hidden="true" className="relative h-[34svh] min-h-56 w-full">
      {gate.ready && !gate.fallback && (
        <SignalCanvas variant={variant} count={gate.count} frameloop={gate.frameloop} />
      )}
    </div>
  );
}
