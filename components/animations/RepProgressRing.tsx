/** req #11 — rep_ring: circular rep progress. Smooth dash-offset
 *  transition driven by reps/target. */

import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function RepProgressRing({
  reps,
  target,
  size = 56,
  strokeWidth = 4,
  className = "text-accent",
}: {
  reps: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(1, reps / target) : 0;
  const offset = circumference * (1 - progress);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={reps}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={`${reps} of ${target} reps`}
    >
      {/* Background SVG Animation */}
      <AnimatedSvgIcon src="/animatedsvgs/svg_rep_ring.svg" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" themeColor="accent" />
      
      <svg width={size} height={size} className="-rotate-90 relative z-10" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-border"
          opacity={0.4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset var(--motion-slow) var(--ease-clickhouse)",
          }}
        />
      </svg>
      <span className="absolute font-mono text-xs font-bold text-hi">
        {reps}/{target}
      </span>
    </div>
  );
}
