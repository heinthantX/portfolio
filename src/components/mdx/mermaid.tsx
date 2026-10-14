"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // 1. Observe when the diagram is scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isVisible) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  // 2. Lazy-import mermaid and render SVG with theme 'base' & tokens
  useEffect(() => {
    if (!isVisible || !chart) return;
    let isCancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;

        const rootStyles = getComputedStyle(document.documentElement);
        const lineStrong =
          rootStyles.getPropertyValue("--line-strong").trim() ||
          rootStyles.getPropertyValue("--color-line-strong").trim() ||
          "#3A4350";
        const text =
          rootStyles.getPropertyValue("--text").trim() ||
          rootStyles.getPropertyValue("--color-text").trim() ||
          "#E6EAF0";
        const surface =
          rootStyles.getPropertyValue("--surface").trim() ||
          rootStyles.getPropertyValue("--color-surface").trim() ||
          "#12161B";
        const isDark =
          document.documentElement.classList.contains("dark") ||
          !document.documentElement.classList.contains("light");

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            darkMode: isDark,
            background: "transparent",
            mainBkg: surface,
            textColor: text,
            lineColor: lineStrong,
            primaryColor: surface,
            primaryTextColor: text,
            primaryBorderColor: lineStrong,
            nodeBorder: lineStrong,
            clusterBkg: "transparent",
            clusterBorder: lineStrong,
            edgeLabelBackground: surface,
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            fontSize: "13px",
          },
          securityLevel: "loose",
        });

        const { svg: renderedSvg } = await mermaid.render(diagramId, chart);

        if (!isCancelled) {
          setSvg(renderedSvg);
          setFailed(false);
        }
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        if (!isCancelled) {
          setFailed(true);
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [isVisible, chart, diagramId]);

  if (failed) {
    return (
      <figure className="my-6 overflow-hidden rounded-md border border-line bg-surface p-4">
        <figcaption className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted-foreground">
          Diagram (raw code)
        </figcaption>
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text">
          <code>{chart}</code>
        </pre>
      </figure>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-8 flex min-h-[140px] w-full items-center justify-center overflow-x-auto rounded-md border border-line bg-surface/60 p-6 transition-colors hover:border-line-strong"
    >
      {svg ? (
        <div
          className="flex w-full justify-center [&_svg]:h-auto [&_svg]:max-w-full"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid produces sanitized SVGs
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground animate-pulse">
          <span className="size-2 rounded-full bg-signal" />
          <span>Rendering diagram…</span>
        </div>
      )}
    </div>
  );
}
