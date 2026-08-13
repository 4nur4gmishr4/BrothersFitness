import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function PulseDot({ className = "w-3 h-3", color = "bg-status-success" }: { className?: string; color?: string; }) {
  return (
    <div className={className}>
      <AnimatedSvgIcon src="/animatedsvgs/svg_pulse_dot.svg" className="w-full h-full" themeColor="accent" />
    </div>
  );
}
