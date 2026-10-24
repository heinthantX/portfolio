import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReadingProgress } from "@/components/article/reading-progress";
import { TableOfContents } from "@/components/article/toc";
import { mdxComponents } from "@/components/mdx/components";
import { MDXContent } from "@/components/mdx/mdx-content";
import { Container, SampleBadge, Tag } from "@/components/site/primitives";
import { getWork, work } from "@/lib/content";

export async function generateStaticParams() {
  // Cache Components requires at least one param; the placeholder renders notFound().
  if (work.length === 0) {
    return [{ slug: "__placeholder__" }];
  }
  return work.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getWork(slug);
  if (!item) return {};

  return {
    title: item.title,
    description: item.summary,
  };
}

// The shell renders instantly; the part that awaits params streams in (Next 16 instant navigation).
export default function WorkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <Container className="pt-32 pb-24" aria-busy="true">
          <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
        </Container>
      }
    >
      <WorkDetail params={params} />
    </Suspense>
  );
}

async function WorkDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getWork(slug);

  if (!item) {
    notFound();
  }

  const currentIndex = work.findIndex((w) => w.slug === slug);
  const nextProject = work.length > 0 ? work[(currentIndex + 1) % work.length] : null;

  return (
    <>
      <ReadingProgress />

      <Container className="pt-32 pb-24" data-paras>
        {/* Header section */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href="/work"
              className="link-underline font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-signal transition-colors inline-flex items-center gap-1"
            >
              ← All work
            </Link>
            <span className="font-mono text-xs text-muted-foreground">/</span>
            {item.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            <SampleBadge mock={item.mock} />
          </div>

          <h1 className="text-[length:var(--text-h1)] font-semibold tracking-[-0.03em] text-text">
            {item.title}
          </h1>
          <p className="mt-4 max-w-[68ch] text-lg text-muted-foreground leading-relaxed">
            {item.outcome}
          </p>
        </div>

        {/* Full-width cover */}
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-md border border-line bg-surface my-8">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        {/* Meta row in mono (Role / Timeline / Stack / Links) */}
        <div className="my-8 border-y border-line py-6 font-mono text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="uppercase tracking-[0.12em] text-muted-foreground mb-1">Role</p>
              <p className="text-text font-medium">{item.role}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.12em] text-muted-foreground mb-1">Timeline</p>
              <p className="text-text font-medium">{item.timeline}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.12em] text-muted-foreground mb-1">Stack</p>
              <p className="text-text font-medium leading-relaxed">{item.stack.join(" · ")}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.12em] text-muted-foreground mb-1">Links</p>
              {item.links.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {item.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline inline-flex items-center gap-1 text-signal hover:text-signal-strong"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>

        {/* 12-col grid: sticky TOC on the left (lg only) and article on the right (max 68ch) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <TableOfContents toc={item.toc} />
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 max-w-[68ch]">
            <article className="prose-article">
              <MDXContent code={item.body} components={mdxComponents} />
            </article>

            {/* Next project footer card (cycles) */}
            {nextProject && (
              <div className="mt-20 border-t border-line pt-10">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Next project →
                </p>
                <Link
                  href={`/work/${nextProject.slug}`}
                  className="group block rounded-md border border-line bg-surface p-6 transition-colors hover:border-signal"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {nextProject.tags.join(" · ")}
                        </span>
                        <SampleBadge mock={nextProject.mock} />
                      </div>
                      <h4 className="text-xl font-semibold text-text group-hover:text-signal transition-colors">
                        {nextProject.title}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 max-w-[50ch]">
                        {nextProject.outcome}
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
