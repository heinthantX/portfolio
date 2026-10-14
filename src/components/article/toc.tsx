"use client";

import { cn } from "cn";
import { useEffect, useState } from "react";

export interface TocItem {
  title: string;
  url: string;
  items?: TocItem[];
}

interface TableOfContentsProps {
  toc?: TocItem[];
  className?: string;
}

export function TableOfContents({ toc: initialToc, className }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>(initialToc ?? []);
  const [activeId, setActiveId] = useState<string>("");

  // If toc was not precomputed (e.g. on notes pages), extract headings from DOM
  useEffect(() => {
    if (initialToc && initialToc.length > 0) {
      setItems(initialToc);
      return;
    }

    const headingEls = Array.from(document.querySelectorAll("article h2[id], article h3[id]"));
    if (headingEls.length === 0) return;

    const extracted: TocItem[] = [];
    let currentH2: TocItem | null = null;

    for (const el of headingEls) {
      const title = el.textContent?.replace(/#$/, "").trim() || "";
      const url = `#${el.id}`;
      if (el.tagName.toLowerCase() === "h2") {
        currentH2 = { title, url, items: [] };
        extracted.push(currentH2);
      } else if (el.tagName.toLowerCase() === "h3") {
        const h3Item: TocItem = { title, url };
        if (currentH2?.items) {
          currentH2.items.push(h3Item);
        } else {
          extracted.push(h3Item);
        }
      }
    }

    setItems(extracted);
  }, [initialToc]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    // Gather all target IDs from items
    const ids: string[] = [];
    const collectIds = (list: TocItem[]) => {
      for (const item of list) {
        if (item.url?.startsWith("#")) {
          ids.push(item.url.slice(1));
        }
        if (item.items) {
          collectIds(item.items);
        }
      }
    };
    collectIds(items);

    if (ids.length === 0) return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible headings and pick the one nearest to top
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position relative to viewport
          visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top),
          );
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0, 1],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const renderItem = (item: TocItem, isNested = false) => {
    const id = item.url.replace(/^#/, "");
    const isActive = activeId === id;

    return (
      <li key={item.url} className="my-1">
        <a
          href={item.url}
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById(id);
            if (target) {
              target.scrollIntoView({ behavior: "smooth" });
              history.pushState(null, "", item.url);
              setActiveId(id);
            }
          }}
          className={cn(
            "block text-xs leading-normal transition-colors",
            isNested ? "pl-7 text-[0.8125rem]" : "pl-4",
            isActive
              ? "border-l-2 -ml-[2px] border-signal text-signal font-medium"
              : "text-muted-foreground hover:text-text",
          )}
        >
          {item.title}
        </a>
        {item.items && item.items.length > 0 && (
          <ul className="space-y-1">{item.items.map((sub) => renderItem(sub, true))}</ul>
        )}
      </li>
    );
  };

  return (
    <nav
      aria-label="Table of contents"
      className={cn("sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto pr-4", className)}
    >
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1.5 border-l border-line text-xs">
        {items.map((item) => renderItem(item))}
      </ul>
    </nav>
  );
}
