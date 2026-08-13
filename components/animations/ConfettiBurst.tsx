import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function ConfettiBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center" aria-hidden="true">
      <AnimatedSvgIcon src="/animatedsvgs/lottie_confetti_burst.svg" className="w-full h-full" themeColor="default" />
    </div>
  );
}
