"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/** Light ↔ dark. The first visit starts from the OS setting (next-themes "system" default). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      {/* Icons switch by the <html> class, so the server render never mismatches. */}
      <Sun className="hidden size-4 light:block" aria-hidden />
      <Moon className="size-4 light:hidden" aria-hidden />
    </Button>
  );
}
