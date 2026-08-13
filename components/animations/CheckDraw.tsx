import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function CheckDraw({ size = 24, className = "text-status-success" }: { size?: number; className?: string; }) {
  return (
    <div style={{ width: size, height: size }}>
      <AnimatedSvgIcon src="/animatedsvgs/lottie_check_draw.svg" className={"$className w-full h-full"} themeColor="accent" />
    </div>
  );
}
