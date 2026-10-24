"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useSignalGate } from "./useSignalGate";

const SignalCanvas = dynamic(() => import("./SignalCanvas"), { ssr: false });

/** Stand-alone 404 scene: points form "404", scatter and reform; the cursor repels. */
export function SignalScene() {
  const ref = useRef<HTMLDivElement>(null);
  const gate = useSignalGate(ref);
  return (
    <div ref={ref} aria-hidden="true" className="relative h-[34svh] min-h-56 w-full">
      {gate.ready && !gate.fallback && (
        <SignalCanvas count={gate.count} frameloop={gate.frameloop} />
      )}
    </div>
  );
}
