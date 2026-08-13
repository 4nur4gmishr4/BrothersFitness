/** req #12 — timer_tick: seconds pop on each tick while running.
 *  Uses `key` remount to replay the animation each second. */

import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function TimerTick({
  seconds,
  active,
  format,
  className = "",
}: {
  seconds: number;
  active: boolean;
  format?: (s: number) => string;
  className?: string;
}) {
  const fmt =
    format ??
    ((s: number) =>
      `${Math.floor(s / 60)
        .toString()
        .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        key={active ? seconds : "idle"}
        className={`inline-block tabular-nums ${active ? "timer-tick" : ""}`}
      >
        {fmt(seconds)}
      </span>
      {active && (
        <AnimatedSvgIcon src="/animatedsvgs/lottie_timer_tick.svg" className="w-5 h-5 opacity-70" themeColor="accent" />
      )}
    </span>
  );
}
