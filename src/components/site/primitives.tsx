import { cn } from "cn";

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SampleBadge({ mock }: { mock: boolean }) {
  if (!mock) return null;
  return (
    <span
      title="Placeholder content — hidden in production builds"
      className="inline-flex items-center rounded-sm border border-dashed border-line-strong px-1.5 py-px font-mono text-[0.625rem] tracking-[0.12em] text-muted-foreground uppercase"
    >
      Sample
    </span>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  index,
  slug,
  title,
  id,
  className,
  as: Heading = "h2",
}: {
  index: string;
  slug: string;
  title: React.ReactNode;
  id?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-[48rem]", className)} data-reveal="headline">
      <Eyebrow>
        {index} / {slug}
      </Eyebrow>
      <Heading id={id} className="mt-3 text-[length:var(--text-h2)]">
        {title}
      </Heading>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line-strong px-1 font-mono text-[0.6875rem] text-muted-foreground">
      {children}
    </kbd>
  );
}

export function StatusDot({ ok = true, label }: { ok?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[0.8125rem] text-muted-foreground">
      <span className="relative flex size-2" aria-hidden>
        {ok && (
          <span className="absolute inset-0 animate-ping rounded-full bg-ok opacity-40 motion-reduce:hidden" />
        )}
        <span className={cn("relative size-2 rounded-full", ok ? "bg-ok" : "bg-dim")} />
      </span>
      {label}
    </span>
  );
}

/** Max-width page container with the spec's 16 / 24 / 40 px gutters. */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10", className)}>
      {children}
    </div>
  );
}
