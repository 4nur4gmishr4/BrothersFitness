import AnimatedSvgIcon from "@/components/ui/AnimatedSvgIcon";

export default function PageSpinner({ label = "LOADING" }: { label?: string }) {
  return (
    <div className="min-h-[100svh] bg-surface-canvas flex flex-col items-center justify-center gap-4 text-hi">
      <AnimatedSvgIcon
        src="/animatedsvgs/svg_page_spinner.svg"
        className="w-16 h-16"
        themeColor="accent"
      />
      <p className="text-xs uppercase tracking-wider text-low font-medium">
        {label}
      </p>
    </div>
  );
}
