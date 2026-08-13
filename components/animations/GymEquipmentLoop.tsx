import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function GymEquipmentLoop({ size = 64 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <AnimatedSvgIcon src="/animatedsvgs/lottie_gym_equipment.svg" className="w-full h-full" themeColor="accent" />
    </div>
  );
}
