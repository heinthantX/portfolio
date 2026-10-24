import type * as React from "react";

/** Abstract, animated sketches of each page for the nav hover card. Decorative only. */

const d = (i: number) => ({ "--d": `${i * 70}ms` }) as React.CSSProperties;
const bar = "pv-grow h-1.5 rounded-full bg-line-strong";

function Work() {
  return (
    <div className="grid h-full grid-cols-2 gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={d(i)}
          className="pv-pop flex flex-col justify-end gap-1 rounded-md border border-line bg-surface-2 p-2"
        >
          <div style={d(i + 2)} className={`${bar} w-3/4 bg-signal/70`} />
          <div style={d(i + 3)} className={`${bar} w-1/2`} />
        </div>
      ))}
    </div>
  );
}

function Notes() {
  return (
    <div className="flex h-full flex-col justify-between">
      {[0.9, 0.7, 0.8, 0.55, 0.75].map((w, i) => (
        <div key={w} className="flex items-center gap-2 border-b border-line pb-1.5">
          <div style={d(i)} className="pv-pop size-1.5 shrink-0 rounded-full bg-signal" />
          <div style={{ ...d(i + 1), width: `${w * 100}%` }} className={bar} />
        </div>
      ))}
    </div>
  );
}

function Resume() {
  return (
    <div className="relative flex h-full flex-col justify-between pl-5">
      <div
        style={d(0)}
        className="pv-grow-y absolute top-1 bottom-1 left-[5px] w-px bg-signal/60"
      />
      {[0, 1, 2].map((i) => (
        <div key={i} className="relative space-y-1">
          <div
            style={d(i * 2 + 1)}
            className="pv-pop absolute top-0 -left-[18px] size-2.5 rounded-full border border-signal bg-bg"
          />
          <div style={d(i * 2 + 1)} className={`${bar} w-2/5 bg-text/50`} />
          <div style={d(i * 2 + 2)} className={`${bar} w-4/5`} />
        </div>
      ))}
    </div>
  );
}

function Uses() {
  return (
    <div className="flex h-full flex-col gap-1.5 rounded-md border border-line bg-bg/60 p-2 font-mono text-[0.625rem] leading-none text-muted-foreground">
      <div className="flex gap-1">
        {["bg-red-400/70", "bg-yellow-400/70", "bg-green-400/70"].map((c) => (
          <span key={c} className={`size-1.5 rounded-full ${c}`} />
        ))}
      </div>
      {["$ nvim .", "$ pnpm dev", "$ claude"].map((t, i) => (
        <div
          key={t}
          style={{ ...d(i * 5), "--n": t.length } as React.CSSProperties}
          className="pv-type overflow-hidden whitespace-nowrap"
        >
          <span className="text-signal">{t.slice(0, 1)}</span>
          {t.slice(1)}
        </div>
      ))}
      <span className="pv-blink mt-auto h-2 w-1.5 bg-signal" />
    </div>
  );
}

function Contact() {
  return (
    <div className="relative grid h-full place-items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 600}ms` }}
          className="pv-ping absolute size-10 rounded-full border border-signal/70"
        />
      ))}
      <div className="pv-pop relative grid h-8 w-11 place-items-center rounded-sm border border-signal bg-surface-2">
        <div className="pv-grow-y absolute inset-x-0 top-0 h-px origin-top bg-signal" />
        <svg
          viewBox="0 0 44 32"
          className="absolute inset-0 size-full text-signal"
          aria-hidden="true"
        >
          <path
            d="M1 1 L22 18 L43 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="pv-draw"
            pathLength={1}
          />
        </svg>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div style={d(0)} className={`${bar} h-3 w-4/5 bg-text/60`} />
      <div style={d(1)} className={`${bar} w-3/5`} />
      <div className="mt-2 flex gap-1.5">
        <div style={d(3)} className="pv-pop h-4 w-12 rounded-sm bg-signal/80" />
        <div style={d(4)} className="pv-pop h-4 w-12 rounded-sm border border-line-strong" />
      </div>
    </div>
  );
}

export const previews: Record<string, () => React.ReactElement> = {
  "/": Home,
  "/work": Work,
  "/notes": Notes,
  "/resume": Resume,
  "/uses": Uses,
  "/contact": Contact,
};

export const blurbs: Record<string, string> = {
  "/": "Hero, about and selected highlights",
  "/work": "Case studies of shipped systems",
  "/notes": "Engineering notes and write-ups",
  "/resume": "Roles, impact and capabilities",
  "/uses": "Editor, terminal and daily tools",
  "/contact": "Email, socials and availability",
};
