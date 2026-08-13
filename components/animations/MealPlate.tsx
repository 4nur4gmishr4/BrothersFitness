import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function MealPlate({ active = true, size = 64 }: { active?: boolean; size?: number; }) {
  return (
    <div style={{ width: size, height: size }} className={active ? "opacity-100" : "opacity-50"}>
      <AnimatedSvgIcon src="/animatedsvgs/lottie_meal_plate.svg" className="w-full h-full" themeColor="accent" />
    </div>
  );
}
