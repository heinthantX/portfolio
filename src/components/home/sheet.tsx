import { cn } from "cn";
import type * as React from "react";
import { Container, SectionHeading } from "@/components/site/primitives";

export interface SheetProps {
  index: string;
  slug: string;
  total?: number;
  title: React.ReactNode;
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ index, slug, total = 8, title, id, children, className }: SheetProps) {
  const headingId = `${id}-heading`;
  const formattedTotal = String(total).padStart(2, "0");

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("relative py-[clamp(6rem,12vw,10rem)]", className)}
    >
      {/* Top full-width hairline that draws in (data-draw="x", bg-line not amber) */}
      <div
        data-draw="x"
        className="absolute top-0 inset-x-0 h-px w-full origin-left bg-line"
        aria-hidden="true"
      />

      <Container>
        {/* Title block row: SectionHeading on the left and, on lg+, a muted mono 'SHEET 03 / 08' on the right */}
        <div className="mb-12 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading index={index} slug={slug} title={title} id={headingId} />
          <div
            aria-hidden="true"
            className="hidden pb-1 font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase select-none lg:block"
          >
            SHEET {index} / {formattedTotal}
          </div>
        </div>

        {children}
      </Container>
    </section>
  );
}
