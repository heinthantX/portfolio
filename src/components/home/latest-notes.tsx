import Link from "next/link";
import { SampleBadge } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { notes } from "@/lib/content";
import { Sheet } from "./sheet";

interface LatestNotesProps {
  index?: string;
  total?: number;
}

export function LatestNotes({ index = "07", total = 8 }: LatestNotesProps) {
  if (notes.length === 0) {
    return null;
  }

  const latestNotes = notes.slice(0, 4);

  return (
    <Sheet index={index} slug="notes" total={total} title="Latest notes" id="notes">
      <ul className="divide-y divide-line border-y border-line">
        {latestNotes.map((note) => (
          <li key={note.slug} data-reveal>
            <Link
              href={`/notes/${note.slug}`}
              className="group flex flex-col justify-between gap-3 py-6 transition-colors sm:flex-row sm:items-baseline"
            >
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                <time
                  dateTime={note.date}
                  className="shrink-0 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {note.date.split("T")[0]}
                </time>

                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <h3 className="link-underline text-base font-medium text-text transition-colors group-hover:text-signal sm:text-lg">
                    {note.title}
                  </h3>
                  <SampleBadge mock={note.mock} />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 font-mono text-xs text-muted-foreground">
                <span>{note.metadata.readingTime} min</span>
                <span
                  className="hidden text-signal opacity-0 transition-opacity group-hover:opacity-100 sm:inline"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Link to /notes at the end */}
      <div className="mt-12 flex justify-center sm:mt-16" data-reveal>
        <Button variant="secondary" asChild>
          <Link href="/notes" className="gap-2">
            <span>All engineering notes</span>
            <span aria-hidden="true">→</span>
          </Link>
        </Button>
      </div>
    </Sheet>
  );
}
