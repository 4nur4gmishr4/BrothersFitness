import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function BellRing({ className = "w-5 h-5 text-accent" }: { className?: string }) {
  return (
    <AnimatedSvgIcon src="/animatedsvgs/lottie_bell_ring.svg" className={className} themeColor="accent" />
  );
}
