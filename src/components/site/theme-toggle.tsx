"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";

/** Light ↔ dark. The first visit starts from the OS setting (next-themes "system" default). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = resolvedTheme === "light" ? "dark" : "light";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced || document.hidden) {
      setTheme(next);
      return;
    }
    // Circular reveal of the new theme, centred on the button.
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
    // A transition aborted mid-way (tab hidden, another transition) rejects; the theme still applies.
    transition.finished.catch(() => {});
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 450,
            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle light and dark theme" onClick={toggle}>
      {/* Icons switch by the <html> class, so the server render never mismatches. */}
      <Sun className="hidden size-4 light:block" aria-hidden />
      <Moon className="size-4 light:hidden" aria-hidden />
    </Button>
  );
}
