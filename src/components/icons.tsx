type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ChevronRight({ className = "btn-icon" }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronLeft({ className = "btn-icon" }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
