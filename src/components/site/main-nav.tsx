"use client";

import { House, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { nav } from "./nav";
import { blurbs, previews } from "./nav-preview";

const active = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Header links. Off the home page a Home link leads the list. On mobile the list moves into MobileMenu and Home stays as an icon. */
export function MainNav() {
  const path = usePathname();
  const home = path !== "/";
  const links = home ? [{ href: "/", label: "Home" }, ...nav] : nav;
  const navRef = useRef<HTMLElement>(null);
  const hide = useRef<number>(undefined);
  // the hovered link and how far the point its arrow dives into sits from the nav's right edge
  // (the card grows leftwards from there, its nail hole under that point)
  const [hover, setHover] = useState<{ href: string; label: string; x: number } | null>(null);
  // a pointer passing over the nav shouldn't fire the arrow and card, so a mouse hover waits
  // SHOW_DELAY first; once the card is open, moving to another link switches at once, and
  // keyboard focus shows it straight away
  const show = (item: { href: string; label: string }, el: HTMLElement, wait = 0) => {
    window.clearTimeout(hide.current);
    const open = () => {
      const nav = navRef.current?.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (nav) setHover({ ...item, x: nav.right - (r.right + DIVE_X) });
    };
    if (hover || !wait) open();
    else hide.current = window.setTimeout(open, wait);
  };
  // a click navigates away, so the card goes at once; it comes back on the next hover
  const close = () => {
    window.clearTimeout(hide.current);
    setHover(null);
  };
  const leave = () => {
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setHover(null), 120);
  };
  // switching browser tabs fires no mouseleave, so drop the card when the window loses focus
  useEffect(() => {
    const drop = () => {
      window.clearTimeout(hide.current);
      setHover(null);
    };
    window.addEventListener("blur", drop);
    return () => window.removeEventListener("blur", drop);
  }, []);
  // a missed mouseleave (fast flick off the window, the header re-rendering under the pointer)
  // would leave the card stuck open; any pointer move away from the nav closes it, unless the
  // link holds keyboard focus
  useEffect(() => {
    if (!hover) return;
    const away = (e: PointerEvent) => {
      if (navRef.current?.contains(e.target as Node)) return;
      if (navRef.current?.querySelector(":focus-visible")) return;
      window.clearTimeout(hide.current);
      setHover(null);
    };
    window.addEventListener("pointermove", away, { passive: true });
    return () => window.removeEventListener("pointermove", away);
  }, [hover]);
  // keep showing the last link while the card and tag fade out
  const last = useRef(hover);
  if (hover) last.current = hover;
  const shown = hover ?? last.current;
  const Preview = shown ? previews[shown.href] : null;

  return (
    <>
      <nav
        ref={navRef}
        data-no-ring
        data-pinned={hover ? "" : undefined}
        aria-label="Main"
        className="relative hidden md:block"
        onMouseLeave={leave}
        onBlur={leave}
      >
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
                // the arrow follows the same state as the card, so the two never disagree
                data-hover={hover?.href === item.href ? "" : undefined}
                className="nav-shot hover:text-text data-hover:text-text aria-[current=page]:text-text"
                onMouseEnter={(e) => show(item, e.currentTarget, SHOW_DELAY)}
                onFocus={(e) => show(item, e.currentTarget)}
                onClick={(e) => {
                  close();
                  // a mouse click leaves the link focused, and the browser refocuses it on return to
                  // the tab, which would reopen the card; keyboard activation (detail 0) keeps focus
                  if (e.detail > 0) e.currentTarget.blur();
                }}
              >
                {item.label}
                <ShotArrow />
              </Link>
            </li>
          ))}
        </ul>
        <div
          aria-hidden="true"
          data-open={hover ? "" : undefined}
          style={{ translate: `${-(shown?.x ?? 0) + HOLE_X}px 0` }}
          className="nav-preview pointer-events-none absolute top-full right-0 mt-5 w-64 origin-top-right rounded-lg border border-line bg-surface/90 p-3 shadow-2xl backdrop-blur-md"
        >
          {/* the nail hole the hovered link's arrow dives into: that arrow is what pins the card */}
          <span className="pv-hole" style={{ right: HOLE_X - 3, top: HOLE_Y - 3 }} />
          {/* keyed so the sketch replays for each link */}
          <div key={`s${shown?.href}`} className="h-32">
            {Preview && <Preview />}
          </div>
          <div
            key={`f${shown?.href}`}
            className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-2 font-mono text-[0.6875rem]"
          >
            <div className="min-w-0">
              <p className="pv-pop text-text">{shown?.label}</p>
              <p
                style={{ "--d": "80ms" } as React.CSSProperties}
                className="pv-pop mt-0.5 text-muted-foreground"
              >
                {shown && blurbs[shown.href]}
              </p>
            </div>
            <span className="shrink-0 text-signal">{shown?.href} →</span>
          </div>
        </div>
      </nav>
      {home && (
        <Link
          href="/"
          aria-label="Home"
          className="animate-in fade-in flex size-8 items-center justify-center rounded-md text-muted-foreground duration-300 hover:bg-surface-2 hover:text-text md:hidden"
        >
          <House className="size-4" aria-hidden="true" />
        </Link>
      )}
    </>
  );
}

/** Mobile menu: a hamburger whose panel drops from the top-right corner. Closes on navigation, Esc or an outside tap. */
export function MobileMenu() {
  const path = usePathname();
  const links = path !== "/" ? [{ href: "/", label: "Home" }, ...nav] : nav;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close whenever the route changes
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const tap = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", tap);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", tap);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-text"
      >
        {/* keyed so the icon spins in on each toggle */}
        <span key={open ? "x" : "m"} className="menu-icon">
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </span>
      </button>
      <nav
        id="mobile-menu"
        aria-label="Main"
        data-open={open ? "" : undefined}
        inert={!open}
        className="mobile-menu absolute top-full right-0 mt-2 w-max min-w-32 origin-top-right rounded-lg border border-line bg-surface/95 p-1.5 shadow-2xl backdrop-blur-md"
      >
        <ul className="font-mono text-[0.875rem]">
          {links.map((item, i) => (
            <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={item.href}
                aria-current={
                  active(path, item.href) && (item.href !== "/" || path === "/")
                    ? "page"
                    : undefined
                }
                onClick={() => setOpen(false)}
                className="block rounded-md py-2.5 pr-8 pl-3 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-text aria-[current=page]:text-text"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Padding of the traced box around the label, the corner radius, and the svg overflow around it. */
const PAD_X = 9;
const PAD_Y = 5;
const R = 6;
const OUT_X = 22;
const OUT_Y = 18;
/** The arrow dives this far right of the link into the card's nail hole, which sits HOLE_X in from
 * the card's right edge and HOLE_Y down from its top; the card hangs mt-5 (20px) under the nav. */
const DIVE_X = PAD_X + 6;
const HOLE_X = 20;
const HOLE_Y = 12;
const CARD_GAP = 20;
/** ms a mouse hover waits before the arrow draws and the card opens. */
const SHOW_DELAY = 180;
const TAIL = "M-12 -4 L-8 0 L-12 4 M-8 -4 L-4 0 L-8 4 M-4 -4 L0 0 L-4 4";
const HEAD = "M-4 -4.5 L5 0 L-4 4.5 L-1.5 0 Z";

/**
 * Arrow path: in from the lower left, once round the label's box, then up through the label on the
 * diagonal, over the top-right corner and down into the card's nail hole `drop` px below the link.
 * The dive is its own path so it only shows while the card is open.
 */
function shotPath(w: number, h: number, drop: number) {
  const x0 = OUT_X - PAD_X;
  const y0 = OUT_Y - PAD_Y;
  const x1 = OUT_X + w + PAD_X;
  const y1 = OUT_Y + h + PAD_Y;
  const lap = `H${x1 - R} A${R} ${R} 0 0 0 ${x1} ${y1 - R} V${y0 + R} A${R} ${R} 0 0 0 ${x1 - R} ${y0} H${x0 + R} A${R} ${R} 0 0 0 ${x0} ${y0 + R} V${y1 - R} A${R} ${R} 0 0 0 ${x0 + R} ${y1}`;
  const d = [`M${x0 - 18} ${y1 + 6}`, `Q${x0 - 4} ${y1} ${x0 + R} ${y1}`, lap].join(" ");
  // the shot through the label: drawn as a moving dash, so nothing is left over the text at rest
  const cross = `M${x0 + R} ${y1} L${x1 - 2} ${y0 - 4}`;
  const rad = Math.atan2(y0 - 4 - y1, x1 - 2 - x0 - R);
  const xd = OUT_X + w + DIVE_X;
  const hole = OUT_Y + drop;
  // head tip lands on the hole; the stroke stops a gap short of the head
  const dive = `M${x1 - 2} ${y0 - 4} C${x1 + 3} ${y0 - 7} ${xd} ${y0 - 7} ${xd} ${y0 + 2} V${hole - 9}`;
  return {
    d,
    cross,
    dive,
    // at rest (current page) the head points out of the top-right corner, along the shot's line
    rest: {
      at: [x1 - 2 + Math.cos(rad), y0 - 4 + Math.sin(rad)],
      angle: (rad * 180) / Math.PI,
    },
    head: [xd, hole - 2],
    tail: [x0 - 18, y1 + 6],
    // the diagonal goes behind the first half of the label and comes out in front of the second
    front: OUT_X + w / 2,
  };
}

/**
 * The hover arrow: one rounded stroke that comes in from the lower left, traces a box round the
 * label (behind it), pierces the label on the diagonal, then hooks over and dives into the preview
 * card's nail hole, so the arrow is what pins the card. At rest it is the label's outline. Two stacked copies of the stroke draw in sync: one behind the text, one in
 * front masked to the label's right half, which makes the diagonal thread through the word.
 */
function ShotArrow() {
  const ref = useRef<HTMLSpanElement>(null);
  const mask = `shot${useId().replace(/:/g, "")}`;
  const [size, setSize] = useState<{ w: number; h: number; drop: number } | null>(null);

  useLayoutEffect(() => {
    const link = ref.current?.parentElement;
    const nav = link?.closest("nav");
    if (!link || !nav) return;
    const measure = () =>
      setSize({
        w: link.offsetWidth,
        h: link.offsetHeight,
        drop:
          nav.getBoundingClientRect().bottom - link.getBoundingClientRect().top + CARD_GAP + HOLE_Y,
      });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(link);
    return () => ro.disconnect();
  }, []);

  const shot = size && shotPath(size.w, size.h, size.drop);
  const box = size
    ? {
        width: size.w + OUT_X * 2,
        height: OUT_Y + Math.max(size.h + OUT_Y, size.drop + 8),
        style: { left: -OUT_X, top: -OUT_Y },
      }
    : { width: 0, height: 0 };
  return (
    <span ref={ref} aria-hidden="true" className="shot-arrow">
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative, the wrapper is aria-hidden */}
      <svg {...box}>
        {shot && (
          <>
            <path className="shot-line" pathLength={1} d={shot.d} />
            <path className="shot-cross" pathLength={1} d={shot.cross} />
            <g transform={`translate(${shot.tail[0]} ${shot.tail[1]}) rotate(-18)`}>
              <path className="shot-tail" d={TAIL} />
            </g>
            <path className="shot-dive" pathLength={1} d={shot.dive} />
            <g
              transform={`translate(${shot.rest.at[0]} ${shot.rest.at[1]}) rotate(${shot.rest.angle})`}
            >
              <path className="shot-rest-head" d={HEAD} />
            </g>
            <g transform={`translate(${shot.head[0]} ${shot.head[1]}) rotate(90)`}>
              <path className="shot-head" d={HEAD} />
            </g>
          </>
        )}
      </svg>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative, the wrapper is aria-hidden */}
      <svg {...box} className="shot-front">
        {shot && size && (
          <>
            <mask
              id={mask}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={box.width}
              height={box.height}
            >
              <rect x={shot.front} y="0" width={box.width} height={box.height} fill="white" />
            </mask>
            <g mask={`url(#${mask})`}>
              <path className="shot-cross shot-halo" pathLength={1} d={shot.cross} />
              <path className="shot-cross" pathLength={1} d={shot.cross} />
            </g>
          </>
        )}
      </svg>
    </span>
  );
}
