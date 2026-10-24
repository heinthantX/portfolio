# ScrollWords

Word-split text with scroll-linked reveals. Source: `src/components/site/scroll-words.tsx`. Styles: `src/app/globals.css`. Rationale: `docs/design/DECISIONS.md` (D9).

## Architecture
- Splits its children into word spans. A full sr-only copy of the text is kept and the word spans are `aria-hidden`, so assistive tech reads the sentence once.
- Props: `accent` (words to emphasise) and `mode` (`view` or `driven`).
- Accent matching is case-insensitive and ignores punctuation. Both the accent list and the words are normalised.
- `view` mode: CSS `view-timeline --words` on the block. Word `i` of `n` animates over an `animation-range` from cover `4% + i/n × 30%` to `14% + i/n × 30%`.
- `driven` mode: an ancestor sets `--reveal` (0..1). Each word computes its own `--t` in CSS, so about four words are mid-reveal at once. `[data-line]` elements take `--d` and stagger whole lines.
- Word states: opacity 0.15, blur 6px, 0.25em below, then rest (opacity 1, no blur, no offset). Blur applies only at ≥768px.
- Safe defaults: words stay fully visible without JS, without scroll-timeline support, and under reduced motion.

## Core Flows
1. **Home (view mode):** the pull quote (accents: every, layer), both bio paragraphs, and the contact h3 (accents: holds, up). Section wrappers no longer carry their own `data-reveal`, so each word fades once.
2. **Hero manifesto (driven mode):** the hero frame loop sets `--reveal` from `textState().reveal`. `REVEAL_SPAN` is 0.07 for the wave and 0.06 for layer chapters, so words finish before the chapter's rest point. The loop writes `--reveal` only when it changes by more than 0.002.
3. **Section headings:** `SectionHeading` uses `data-reveal="headline"` (blur 8px, rise 0.4em, scale 0.98). This is a block reveal, not a word split.

## Edge Cases
- Accents are matched after stripping punctuation from both sides. Without that, "holds." never matches "holds".
- Mobile (<768px) has no blur. The rise and opacity still play.
- Reduced motion, no JS, or no `view-timeline` support: words stay visible and nothing animates.
- Idle scrolling does no style work, because `--reveal` is written only on a change above 0.002.
- A `data-reveal` on a wrapper around a ScrollWords block causes a double fade. Keep it off the wrapper.

## Autonomous UX Polish
- Accent words give the pull quote and the contact heading a focal beat with no extra motion.
- Headline blur-rise on every section heading keeps reveals consistent across pages.
- The sr-only full sentence gives screen readers and copy-paste clean text.
- Content is readable by default, so the no-JS and reduced-motion paths need no special casing.
