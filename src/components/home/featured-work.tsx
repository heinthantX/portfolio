import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { SampleBadge, Tag } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { featuredWork } from "@/lib/content";
import { Sheet } from "./sheet";

interface FeaturedWorkProps {
  index?: string;
  total?: number;
}

export function FeaturedWork({ index = "04", total = 8 }: FeaturedWorkProps) {
  if (featuredWork.length === 0) {
    return null;
  }

  return (
    <Sheet index={index} slug="work" total={total} title="Featured work" id="work">
      <div className="divide-y divide-line border-y border-line">
        {featuredWork.map((item, i) => {
          const isEven = i % 2 === 0;

          return (
            <article
              key={item.slug}
              data-block
              className="group py-12 first:pt-6 last:pb-6 sm:py-16"
            >
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
                {/* 16:10 cover image with a 1px frame that turns amber on hover */}
                <div className={cn("lg:col-span-6", !isEven && "lg:order-2")}>
                  <Link
                    href={`/work/${item.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="block"
                    data-cursor="View"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-line bg-surface transition-colors duration-200 group-hover:border-signal">
                      <Image
                        src={item.cover}
                        alt={`${item.title} cover`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 100vw, 600px"
                      />
                    </div>
                  </Link>
                </div>

                {/* Details column */}
                <div
                  className={cn(
                    "flex flex-col justify-center lg:col-span-6",
                    !isEven && "lg:order-1",
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <SampleBadge mock={item.mock} />
                  </div>

                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-text sm:text-3xl">
                    <Link
                      href={`/work/${item.slug}`}
                      className="transition-colors hover:text-signal"
                      data-cursor="View"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                    {item.outcome}
                  </p>

                  <div className="mt-6">
                    <Link
                      href={`/work/${item.slug}`}
                      className="link-underline inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.12em] text-signal transition-colors hover:text-signal-strong"
                      data-cursor="View"
                    >
                      Read case study →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Link to /work at the end */}
      <div className="mt-12 flex justify-center sm:mt-16" data-block>
        <Button variant="secondary" asChild>
          <Link href="/work" className="gap-2">
            <span>View all projects</span>
            <span aria-hidden="true">→</span>
          </Link>
        </Button>
      </div>
    </Sheet>
  );
}
