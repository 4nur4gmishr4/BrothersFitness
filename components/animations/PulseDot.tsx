export default function PulseDot({ className = "w-3 h-3", color = "bg-accent" }: { className?: string; color?: string; }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
    </div>
  );
}
