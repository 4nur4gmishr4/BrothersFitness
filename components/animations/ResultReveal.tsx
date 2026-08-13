/** req #14 — result_reveal: calculator result — line expands, number
 *  fades in. `valueKey` triggers a remount to replay the animation
 *  whenever the result changes. */

export default function ResultReveal({
  children,
  valueKey,
}: {
  children: React.ReactNode;
  valueKey: string | number;
}) {
  return (
    <div key={valueKey} aria-live="polite">
      <div
        className="h-px bg-accent result-line mb-4"
        aria-hidden="true"
      />
      <div className="result-reveal">{children}</div>
    </div>
  );
}
