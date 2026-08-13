import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

export default function SendArrow({ sending = false, className = "w-5 h-5" }: { sending?: boolean; className?: string; }) {
  return (
    <AnimatedSvgIcon src="/animatedsvgs/lottie_send_arrow.svg" className={"$className $sending ? 'send-fly' : ''"} themeColor="accent" />
  );
}
