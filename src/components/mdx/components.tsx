import { cn } from "cn";
import React from "react";
import { Mermaid } from "./mermaid";
import "./prose.css";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode })?.children);
  }
  return "";
}

function getFirstStrongText(node: React.ReactNode): string | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const text = getFirstStrongText(child);
      if (text) return text;
    }
    return null;
  }
  if (React.isValidElement(node)) {
    if (node.type === "strong") {
      return extractText(node).trim();
    }
    return getFirstStrongText((node.props as { children?: React.ReactNode })?.children);
  }
  return null;
}

export function H2({ id, children, className, ...props }: React.ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      id={id}
      className={cn(
        "group mt-12 mb-4 scroll-mt-24 text-[length:var(--text-h2)] font-semibold tracking-[-0.03em] text-text",
        className,
      )}
      {...props}
    >
      {id ? (
        <a href={`#${id}`} className="inline-flex items-center gap-2 text-inherit no-underline">
          <span>{children}</span>
          <span
            className="font-mono text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          >
            #
          </span>
        </a>
      ) : (
        children
      )}
    </h2>
  );
}

export function H3({ id, children, className, ...props }: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      id={id}
      className={cn(
        "group mt-8 mb-3 scroll-mt-24 text-[length:var(--text-h3)] font-semibold tracking-[-0.03em] text-text",
        className,
      )}
      {...props}
    >
      {id ? (
        <a href={`#${id}`} className="inline-flex items-center gap-2 text-inherit no-underline">
          <span>{children}</span>
          <span
            className="font-mono text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          >
            #
          </span>
        </a>
      ) : (
        children
      )}
    </h3>
  );
}

export function Blockquote({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"blockquote">) {
  const strongText = getFirstStrongText(children);
  const isConstraint = strongText ? /constraint/i.test(strongText) : false;
  const isResult = strongText ? /result/i.test(strongText) : false;

  if (isConstraint) {
    return (
      <aside
        className={cn(
          "my-6 rounded-r-md border-l-2 border-line-strong bg-surface/70 px-4 py-3.5 text-text",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }

  if (isResult) {
    return (
      <aside
        className={cn(
          "my-6 rounded-r-md border-l-2 border-ok bg-ok/5 px-4 py-3.5 text-text",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }

  return (
    <blockquote
      className={cn(
        "my-6 border-l-2 border-line-strong pl-4 italic text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  );
}

export function Pre({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) {
  const dataLang = (props as Record<string, unknown>)["data-language"];
  if (dataLang === "mermaid") {
    const chart = extractText(children).trim();
    return <Mermaid chart={chart} />;
  }
  return <pre {...props}>{children}</pre>;
}

export function Figure({ children, ...props }: React.ComponentPropsWithoutRef<"figure">) {
  const dataLang = (props as Record<string, unknown>)["data-language"];
  if (dataLang === "mermaid") {
    const chart = extractText(children).trim();
    return <Mermaid chart={chart} />;
  }
  return <figure {...props}>{children}</figure>;
}

export function Code({ children, ...props }: React.ComponentPropsWithoutRef<"code">) {
  const dataLang = (props as Record<string, unknown>)["data-language"];
  if (dataLang === "mermaid") {
    const chart = extractText(children).trim();
    return <Mermaid chart={chart} />;
  }
  return <code {...props}>{children}</code>;
}

export function Link({ href, children, className, ...props }: React.ComponentPropsWithoutRef<"a">) {
  const isExternal = href?.startsWith("http");
  return (
    <a
      href={href}
      className={cn("link-underline text-text hover:text-signal", className)}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
    </a>
  );
}

export const mdxComponents = {
  h2: H2,
  h3: H3,
  blockquote: Blockquote,
  pre: Pre,
  figure: Figure,
  code: Code,
  a: Link,
};

export const components = mdxComponents;
