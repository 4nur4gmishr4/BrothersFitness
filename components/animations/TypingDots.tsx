/** req #9 — typing_dots: AI waiting indicator — three staggered dots. */

import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function TypingDots({ active = true }: { active?: boolean }) {
  if (!active) return null;

  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <AnimatedSvgIcon src="/animatedsvgs/lottie_typing_dots.svg" className="w-8 h-8" themeColor="accent" />
    </span>
  );
}
