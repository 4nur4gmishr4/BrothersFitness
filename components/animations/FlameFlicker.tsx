import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function FlameFlicker({ className = "w-5 h-5" }: { className?: string; }) {
  return <AnimatedSvgIcon src="/animatedsvgs/lottie_flame_flicker.svg" className={className} themeColor="accent" />;
}
