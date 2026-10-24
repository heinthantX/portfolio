"use client";

import { House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "./nav";

const active = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Header links. Off the home page a Home link leads the list (an icon on mobile, where the list is hidden). */
export function MainNav() {
  const path = usePathname();
  const home = path !== "/";
  const links = home ? [{ href: "/", label: "Home" }, ...nav] : nav;

  return (
    <>
      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-6 font-mono text-[0.8125rem] text-muted-foreground">
          {links.map((item) => (
            <li
              key={item.href}
              className={
                item.href === "/"
                  ? "animate-in fade-in slide-in-from-top-1 duration-300"
                  : undefined
              }
            >
              <Link
                href={item.href}
                aria-current={item.href !== "/" && active(path, item.href) ? "page" : undefined}
                className="link-underline hover:text-text aria-[current=page]:text-text"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {home && (
        <Link
          href="/"
          aria-label="Home"
          className="animate-in fade-in -mr-3 flex size-8 items-center justify-center rounded-md text-muted-foreground duration-300 hover:bg-surface-2 hover:text-text md:hidden"
        >
          <House className="size-4" aria-hidden="true" />
        </Link>
      )}
    </>
  );
}
