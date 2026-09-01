import MorphingInfinity from "@/components/ui/loaders/MorphingInfinity";

export default function AdminLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <MorphingInfinity className="w-12 h-12 text-accent" />
      <span className="text-xs uppercase tracking-wider font-semibold text-faint animate-pulse">
        Loading Console Data…
      </span>
    </div>
  );
}
