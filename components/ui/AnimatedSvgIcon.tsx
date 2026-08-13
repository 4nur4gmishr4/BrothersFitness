import Image from "next/image";

interface AnimatedSvgIconProps {
  src: string;
  className?: string;
  alt?: string;
  themeColor?: "default" | "accent" | "text-hi";
}

export default function AnimatedSvgIcon({
  src,
  className = "",
  alt = "",
  themeColor = "default",
}: AnimatedSvgIconProps) {
  // CSS filter formulas
  const colorFilter = themeColor === "accent"
    ? "invert(18%) sepia(85%) saturate(4422%) hue-rotate(349deg) brightness(96%) contrast(92%)"
    : themeColor === "text-hi"
      ? "invert(1)" // Basic invert, assumes the base SVG is mostly dark/black
      : "none";
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className} ${themeColor === "text-hi" ? "dark:invert-0 invert" : ""}`}
      style={{ filter: themeColor === "accent" ? colorFilter : undefined }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        unoptimized // Required to preserve <animate> tags
      />
    </div>
  );
}

