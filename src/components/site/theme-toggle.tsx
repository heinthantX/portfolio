"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const order = ["system", "light", "dark"] as const;
type Mode = (typeof order)[number];
const icons = { system: Monitor, light: Sun, dark: Moon } satisfies Record<Mode, unknown>;

/** Cycles system → light → dark. "system" follows the OS setting live. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The saved choice is only known on the client; render a neutral icon until then.
  const current: Mode = mounted && order.includes(theme as Mode) ? (theme as Mode) : "system";
  const next = order[(order.indexOf(current) + 1) % order.length];
  const Icon = icons[current];

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${current}. Switch to ${next}`}
      title={`Theme: ${current}`}
      onClick={() => setTheme(next)}
    >
      <Icon className="size-4" aria-hidden />
    </Button>
  );
}
