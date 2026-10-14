import type { Metadata } from "next";
import Link from "next/link";
import { Container, SampleBadge, SectionHeading } from "@/components/site/primitives";
import { notes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Engineering notes on distributed state synchronization, RBAC design, load testing, zero-downtime databases, and 3D graphics.",
};

export default function NotesPage() {
  return (
    <Container className="pt-32 pb-24">
      <div
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        data-reveal
      >
        <div>
          <SectionHeading index="04" slug="notes" title="Technical Notes & Writing" as="h1" />
          <p className="mt-4 max-w-[68ch] text-muted-foreground leading-relaxed">
            Practical writings on distributed systems, offline-first edge architecture, performance
            ceilings, database migrations, and container infrastructure.
          </p>
        </div>

        <a
          href="/notes/rss.xml"
          className="link-underline font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-signal self-start md:self-end shrink-0 inline-flex items-center gap-1.5"
        >
          <span>RSS Feed</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      {/* List (not cards) */}
      <div className="divide-y divide-line border-y border-line">
        {notes.map((note) => (
          <Link
            key={note.slug}
            href={`/notes/${note.slug}`}
            data-reveal
            data-cursor="Read"
            className="group flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 py-6 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 min-w-0">
              <time
                dateTime={note.date}
                className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground shrink-0"
              >
                {note.date.split("T")[0]}
              </time>

              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h3 className="link-underline text-base sm:text-lg font-medium text-text group-hover:text-signal transition-colors">
                  {note.title}
                </h3>
                <SampleBadge mock={note.mock} />
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono text-xs text-muted-foreground">
              <span>{note.metadata.readingTime} min read</span>
              <span
                className="text-signal opacity-0 transition-opacity group-hover:opacity-100 hidden sm:inline"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
