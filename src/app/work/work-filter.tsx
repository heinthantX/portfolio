"use client";

import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SampleBadge, Tag } from "@/components/site/primitives";
import type { Work } from "@/lib/content";

const TAG_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Front end", value: "front-end" },
  { label: "Back end", value: "back-end" },
  { label: "DevOps", value: "devops" },
  { label: "Mobile", value: "mobile" },
] as const;

interface WorkFilterProps {
  items: Work[];
}

export function WorkFilter({ items }: WorkFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTag = searchParams.get("tag") || "all";

  const handleTagSelect = (tagValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tagValue === "all") {
      params.delete("tag");
    } else {
      params.set("tag", tagValue);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const filteredItems =
    activeTag === "all"
      ? items
      : items.filter((item) => item.tags.includes(activeTag as (typeof item.tags)[number]));

  return (
    <div>
      {/* Radio-like tag filter button group */}
      <fieldset className="border-0 p-0 m-0 flex flex-wrap items-center gap-2 mb-12">
        <legend className="sr-only">Filter projects by discipline</legend>
        {TAG_OPTIONS.map((opt) => {
          const isPressed = activeTag === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isPressed}
              onClick={() => handleTagSelect(opt.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-xs tracking-[0.08em] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2",
                isPressed
                  ? "border-signal bg-signal/10 text-signal font-medium"
                  : "border-line bg-surface text-muted-foreground hover:border-line-strong hover:text-text",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </fieldset>

      {/* List of large rows */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center border-y border-line">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            No projects match the &ldquo;{activeTag}&rdquo; filter.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {filteredItems.map((item) => (
            <article
              key={item.slug}
              data-reveal
              className="group py-12 first:pt-8 last:pb-8 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* 16:10 cover image with 1px border-line frame turning amber on hover */}
                <div className="md:col-span-5 lg:col-span-5">
                  <Link
                    href={`/work/${item.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="block"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-line bg-surface transition-colors duration-200 group-hover:border-signal">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 520px"
                      />
                    </div>
                  </Link>
                </div>

                {/* Content details */}
                <div className="md:col-span-7 lg:col-span-7 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <SampleBadge mock={item.mock} />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-text">
                    <Link
                      href={`/work/${item.slug}`}
                      className="hover:text-signal transition-colors"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[56ch]">
                    {item.outcome}
                  </p>

                  <div className="mt-6">
                    <Link
                      href={`/work/${item.slug}`}
                      className="link-underline inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.12em] text-signal"
                    >
                      Read case study →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
