import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReadingProgress } from "@/components/article/reading-progress";
import { TableOfContents } from "@/components/article/toc";
import { mdxComponents } from "@/components/mdx/components";
import { MDXContent } from "@/components/mdx/mdx-content";
import { Container, SampleBadge, Tag } from "@/components/site/primitives";
import { getNote, notes } from "@/lib/content";

export async function generateStaticParams() {
  // Cache Components requires at least one param; the placeholder renders notFound().
  if (notes.length === 0) {
    return [{ slug: "__placeholder__" }];
  }
  return notes.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};

  return {
    title: note.title,
    description: note.summary,
  };
}

// The shell renders instantly; the part that awaits params streams in (Next 16 instant navigation).
export default function NoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <Container className="pt-32 pb-24" aria-busy="true">
          <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
        </Container>
      }
    >
      <NoteDetail params={params} />
    </Suspense>
  );
}

async function NoteDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = getNote(slug);

  if (!note) {
    notFound();
  }

  const currentIndex = notes.findIndex((n) => n.slug === slug);
  const nextNote = notes.length > 0 ? notes[(currentIndex + 1) % notes.length] : null;

  return (
    <>
      <ReadingProgress />

      <Container className="pt-32 pb-24">
        {/* Header section (without cover / meta row) */}
        <div data-reveal className="mb-10 pb-8 border-b border-line">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href="/notes"
              className="link-underline font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-signal transition-colors inline-flex items-center gap-1"
            >
              ← All notes
            </Link>
            <span className="font-mono text-xs text-muted-foreground">/</span>
            <time
              dateTime={note.date}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
            >
              {note.date.split("T")[0]}
            </time>
            <span className="font-mono text-xs text-muted-foreground">·</span>
            <span className="font-mono text-xs text-muted-foreground">
              {note.metadata.readingTime} min read
            </span>
            <SampleBadge mock={note.mock} />
          </div>

          <h1 className="text-[length:var(--text-h1)] font-semibold tracking-[-0.03em] text-text">
            {note.title}
          </h1>

          <p className="mt-4 max-w-[68ch] text-lg text-muted-foreground leading-relaxed">
            {note.summary}
          </p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>

        {/* 12-col grid: sticky TOC on the left (lg only) and article on the right (max 68ch) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <TableOfContents />
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 max-w-[68ch]">
            <article className="prose-article">
              <MDXContent code={note.body} components={mdxComponents} />
            </article>

            {/* Next note card */}
            {nextNote && (
              <div className="mt-20 border-t border-line pt-10">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Next note →
                </p>
                <Link
                  href={`/notes/${nextNote.slug}`}
                  className="group block rounded-md border border-line bg-surface p-6 transition-colors hover:border-signal"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <time
                          dateTime={nextNote.date}
                          className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          {nextNote.date.split("T")[0]}
                        </time>
                        <SampleBadge mock={nextNote.mock} />
                      </div>
                      <h4 className="text-xl font-semibold text-text group-hover:text-signal transition-colors">
                        {nextNote.title}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 max-w-[50ch]">
                        {nextNote.summary}
                      </p>
                    </div>
                    <span className="font-mono text-base text-signal transition-transform group-hover:translate-x-1 shrink-0">
                      →
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
