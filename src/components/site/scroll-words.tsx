import { Fragment } from "react";

type Tag = "p" | "span" | "h2" | "h3" | "blockquote";

const norm = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

/**
 * Text that sharpens word by word as you scroll (blurred + faint -> crisp).
 * `view`: driven by the element's own scroll position (CSS view timeline).
 * `load`: slides in once on page load, word after word (above-the-fold page intros).
 * `in`: the same slide-in, played by text-reveal.tsx when the block around it scrolls into view.
 * `driven`: driven by a `--reveal` 0..1 custom property an ancestor sets (the sticky hero).
 * Words are visible by default, so it reads fine without JS, without support, or with reduced
 * motion. Screen readers get the sentence once from the sr-only copy.
 */
export function ScrollWords({
  text,
  as: T = "p",
  accent = [],
  mode = "view",
  className,
}: {
  text: string;
  as?: Tag;
  /** words (case-insensitive, punctuation ignored) drawn in the signal colour */
  accent?: string[];
  mode?: "view" | "load" | "in" | "driven";
  className?: string;
}) {
  const words = text.split(" ");
  const hot = new Set(accent.map(norm));
  return (
    <T
      className={className}
      data-words={mode}
      style={{ "--n": words.length } as React.CSSProperties}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: words repeat; order is the identity
          <Fragment key={i}>
            <span
              data-w
              style={{ "--i": i } as React.CSSProperties}
              className={hot.has(norm(w)) ? "text-signal" : undefined}
            >
              {w}
            </span>{" "}
          </Fragment>
        ))}
      </span>
    </T>
  );
}
