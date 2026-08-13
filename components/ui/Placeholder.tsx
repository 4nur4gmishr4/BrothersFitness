/**
 * Placeholder — Geometric SVG placeholder for photos/logo/hero assets.
 *
 * Renders a ClickHouse-grid background with a centered monogram or icon.
 * Used where real images (trainer photos, hero assets, logos) will arrive
 * later. Uses design-system tokens for color; no hardcoded hex.
 */

interface PlaceholderProps {
  /** 1-2 character monogram. Falls back to icon. */
  initials?: string;
  /** Label text displayed when initials is not provided. */
  label?: string;
  /** Override grid color / tone. */
  className?: string;
  /** Show an AnimatedIcon inside instead of initials. */
  icon?: React.ReactNode;
}

export default function Placeholder({
  initials,
  label,
  className = "w-full aspect-square",
  icon,
}: PlaceholderProps) {
  const displayText = initials || label;
  return (
    <div
      className={`placeholder-glyph relative overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Diagonal accent line */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, rgb(var(--accent) / 0.3) 50%, transparent 60%)",
        }}
      />

      {/* Monogram or icon */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {icon ? (
          icon
        ) : displayText ? (
          <span className="heading-display text-xs font-bold text-faint select-none">
            {displayText}
          </span>
        ) : (
          <svg
            className="w-8 h-8 text-faint"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" strokeDasharray="4 2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M3 18l5-5 3 3 4-4 6 6" opacity={0.4} />
          </svg>
        )}
      </div>
    </div>
  );
}
