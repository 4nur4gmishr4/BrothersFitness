import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function TrophyShine() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
      <AnimatedSvgIcon src="/animatedsvgs/trophy_shine.svg" className="w-full h-full" themeColor="default" />
    </div>
  );
}
