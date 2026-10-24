import Link from "next/link";
import { profile } from "@/content/profile";
import { CommandMenu } from "./command-menu";
import { getCommandMenuItems } from "./command-menu-data";
import { MainNav } from "./main-nav";
import { StackGlyph } from "./stack-glyph";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const items = getCommandMenuItems();

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 font-mono text-[0.8125rem] tracking-tight"
        >
          <StackGlyph className="size-5 text-signal" />
          <span>{profile.name.toLowerCase().replace(" ", ".")}</span>
        </Link>
        <MainNav />
        <div className="flex items-center gap-1">
          <CommandMenu items={items} />
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
