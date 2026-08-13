import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function CalculatorGears({ size = 48 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <AnimatedSvgIcon src="/animatedsvgs/lottie_gears.svg" className="w-full h-full" themeColor="accent" />
    </div>
  );
}
