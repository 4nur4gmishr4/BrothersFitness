export default function TypingDots({ active = true }: { active?: boolean }) {
  if (!active) return null;

  return (
    <span className="inline-flex items-center gap-1.5 py-1 px-1" aria-hidden="true">
      <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
