import Link from "next/link";
import { profile } from "@/content/profile";
import { nav } from "./nav";
import { StackGlyph } from "./stack-glyph";

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <StackGlyph className="size-7 text-signal" />
            <span className="font-semibold tracking-tight">{profile.name}</span>
          </Link>
          <p className="mt-3 max-w-[40ch] text-sm text-muted-foreground">{profile.tagline}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-4">
          <ul className="grid grid-cols-2 gap-2 font-mono text-[0.8125rem] text-muted-foreground">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline hover:text-text">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/notes/rss.xml" className="link-underline hover:text-text">
                RSS
              </a>
            </li>
          </ul>
        </nav>
        <ul className="space-y-2 font-mono text-[0.8125rem] text-muted-foreground md:col-span-3">
          <li>
            <a href={`mailto:${profile.contact.email}`} className="link-underline hover:text-text">
              {profile.contact.email}
            </a>
          </li>
          <li>
            <a href={profile.contact.github.href} className="link-underline hover:text-text">
              {profile.contact.github.label}
            </a>
          </li>
          <li>
            <a href={profile.contact.linkedin.href} className="link-underline hover:text-text">
              {profile.contact.linkedin.label}
            </a>
          </li>
        </ul>
        <p className="font-mono text-xs text-muted-foreground md:col-span-12">
          Built with Next.js, React Three Fiber and GSAP ·{" "}
          <a href={profile.contact.github.href} className="link-underline hover:text-text">
            source
          </a>{" "}
          · © {profile.name}
        </p>
      </div>
    </footer>
  );
}
