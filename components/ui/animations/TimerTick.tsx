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
    <span className={`inline-flex items-center justify-center ${className}`}>
      <span
        key={active ? seconds : "idle"}
        className={`inline-block tabular-nums ${active ? "timer-tick" : ""}`}
      >
        {fmt(seconds)}
      </span>
    </span>
  );
}
