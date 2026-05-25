type Props = { className?: string };

// Minimal, geometric ram-horn mark — two mirrored spirals evoking ibex horns.
// Designed as a typographic glyph: thin strokes, no fill, no detail.
export function KuljaMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 32 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* left horn */}
      <path d="M16 20 C 10 19, 5 16, 4 11 C 3.4 7, 6 4.5, 9 5 C 11.4 5.4, 12.5 7.8, 11.5 10 C 10.7 11.8, 8.6 12, 7.6 10.6" />
      {/* right horn */}
      <path d="M16 20 C 22 19, 27 16, 28 11 C 28.6 7, 26 4.5, 23 5 C 20.6 5.4, 19.5 7.8, 20.5 10 C 21.3 11.8, 23.4 12, 24.4 10.6" />
      {/* subtle center mark */}
      <path d="M16 20 L 16 22" />
    </svg>
  );
}
