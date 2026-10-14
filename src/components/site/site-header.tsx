import Link from "next/link";
import { profile } from "@/content/profile";
import { nav } from "./nav";
import { StackGlyph } from "./stack-glyph";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
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
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6 font-mono text-[0.8125rem] text-muted-foreground">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline hover:text-text">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
