/** Four-layer stack mark: Interface, API, Data, Infra. Inherits currentColor. */
export function StackGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      {[4, 9, 14, 19].map((y, i) => (
        <path
          key={y}
          d={`M3 ${y} L12 ${y - 2.5} L21 ${y} L12 ${y + 2.5} Z`}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity={i === 3 ? 1 : 0.55 + i * 0.15}
        />
      ))}
    </svg>
  );
}
