"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import useSWR from "swr";
import fuzzysort from "fuzzysort";
import type { FreeExercise } from "@/lib/fitness-data-service";

// The free-exercise-db JSON ships relative image paths like "3_4_Sit-Up/0.jpg".
// next/image requires an absolute URL or a leading-slash path, so prefix them.
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

function resolveExerciseImage(path: string): string {
  if (!path) return "";
  // Already absolute — leave it alone.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Already has a leading slash — leave it alone.
  if (path.startsWith("/")) return path;
  return `${IMAGE_BASE}${path}`;
}

const FALLBACK_EXERCISES: FreeExercise[] = [
  { id: "bench-press", name: "Barbell Bench Press", category: "chest", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", instructions: ["Lie flat on a bench.", "Lower the bar to mid-chest with control.", "Press up explosively."], images: [] },
  { id: "incline-db-press", name: "Incline Dumbbell Press", category: "chest", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders"], equipment: "dumbbell", instructions: ["Set bench to 30-45 degrees.", "Press dumbbells upward."], images: [] },
  { id: "barbell-squat", name: "Barbell Back Squat", category: "legs", primaryMuscles: ["quadriceps"], secondaryMuscles: ["glutes", "hamstrings"], equipment: "barbell", instructions: ["Rest bar across upper traps.", "Squat until thighs parallel floor.", "Drive up through heels."], images: [] },
  { id: "deadlift", name: "Conventional Deadlift", category: "back", primaryMuscles: ["lower back"], secondaryMuscles: ["hamstrings", "glutes"], equipment: "barbell", instructions: ["Hinge at hips, grip bar shoulder width.", "Pull up keeping spine neutral."], images: [] },
  { id: "pull-up", name: "Overhand Pull-Up", category: "back", primaryMuscles: ["lats"], secondaryMuscles: ["biceps"], equipment: "body only", instructions: ["Grip bar wider than shoulder width.", "Pull chest to bar."], images: [] },
  { id: "overhead-press", name: "Standing Overhead Press", category: "shoulders", primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"], equipment: "barbell", instructions: ["Press barbell overhead in controlled arc."], images: [] },
  { id: "bicep-curl", name: "Dumbbell Bicep Curl", category: "arms", primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"], equipment: "dumbbell", instructions: ["Curl dumbbells upward while keeping elbows tucked."], images: [] },
  { id: "tricep-pushdown", name: "Cable Tricep Pushdown", category: "arms", primaryMuscles: ["triceps"], secondaryMuscles: [], equipment: "cable", instructions: ["Extend elbows downward using rope or straight bar."], images: [] }
];

const fetcher = async (): Promise<FreeExercise[]> => {
  try {
    const res = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
    if (!res.ok) throw new Error("Network response not ok");
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_EXERCISES;
  } catch {
    return FALLBACK_EXERCISES;
  }
};

export default function WorkoutLibrary() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: allExercises, error, isLoading } = useSWR("free-exercise-db", fetcher);

  const exercises = useMemo(() => allExercises || [], [allExercises]);

  const unifiedFilters = [
    "ALL",
    "CHEST",
    "BACK",
    "LEGS",
    "ARMS",
    "SHOULDERS",
    "CORE",
    "CARDIO",
    "STRENGTH",
    "STRETCHING"
  ];

  const filteredExercises = useMemo(() => {
    let pool = exercises;

    if (debouncedSearch.trim()) {
      const fuzzyResults = fuzzysort.go(debouncedSearch.trim(), exercises, {
        keys: ['name', 'category', 'equipment', (obj: FreeExercise) => obj.primaryMuscles.join(' ')],
        threshold: -500,
      });
      pool = fuzzyResults.map((r) => r.obj);
    }

    return pool.filter((ex: FreeExercise) => {
      if (activeFilter === "ALL") return true;

      const f = activeFilter.toLowerCase();
      
      // Map grouped muscle names to actual DB terminology
      const mappedTargets: Record<string, string[]> = {
        arms: ['biceps', 'triceps', 'forearms'],
        legs: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        core: ['abdominis'],
        back: ['lats', 'lower back', 'middle back', 'traps'],
      };

      const matchCategory = ex.category?.toLowerCase() === f;
      const targetMuscles = mappedTargets[f] || [f];
      
      const matchMuscle = targetMuscles.some(tm => 
        (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(tm))) ||
        (ex.secondaryMuscles && ex.secondaryMuscles.some(m => m.toLowerCase().includes(tm)))
      );

      return matchCategory || matchMuscle;
    });
  }, [exercises, debouncedSearch, activeFilter]);

  const pageSize = 18;
  const totalCount = filteredExercises.length;
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedExercises = useMemo(
    () => filteredExercises.slice((page - 1) * pageSize, page * pageSize),
    [filteredExercises, page],
  );

  if (isLoading && !allExercises) {
    return (
      <div className="flex items-center justify-center py-20 text-accent text-xs tracking-wider animate-pulse font-semibold">
        LOADING WORKOUT DATABASE...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 surface-card hairline border-status-danger text-status-danger text-xs font-semibold">
        FAILED TO LOAD EXERCISES. RETRY REQUIRED.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls Header */}
      <div className="flex flex-col gap-6 surface-card hairline p-6">
        
        {/* Unified Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {unifiedFilters.map((f) => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full border transition-all duration-300 text-xs font-semibold uppercase tracking-wider ${
                activeFilter === f 
                  ? "bg-accent border-accent text-white "
                  : "bg-surface-canvas border-surface-border text-mid hover:text-hi hover:border-hi"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-low z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercises by name or equipment..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-canvas border border-surface-border text-hi !pl-11 pr-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors text-sm placeholder:text-low/50 font-medium"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedExercises.map((exercise: FreeExercise) => (
          <div
            key={exercise.id}
            className="surface-card hairline overflow-hidden hover:border-accent transition-colors duration-fast group flex flex-col h-full"
          >
            {/* Image Section */}
            <div className="aspect-video bg-surface-canvas relative overflow-hidden">
              {exercise.images && exercise.images.length > 0 ? (
                <Image
                  src={resolveExerciseImage(exercise.images[0])}
                  alt={exercise.name}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-slow"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Dumbbell className="w-12 h-12 text-surface-border" />
                </div>
              )}

              <div className="absolute top-2 right-2 surface-modal hairline px-2 py-1 z-10 bg-surface-canvas">
                <span className="text-[9px] font-semibold tracking-wider text-accent uppercase">
                  {exercise.category || "STRENGTH"}
                </span>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
              <h3 className="heading-section text-lg text-hi mb-3 line-clamp-1" title={exercise.name}>
                {exercise.name}
              </h3>

              <p className="body-text text-sm text-low line-clamp-3 mb-4">
                {exercise.instructions?.[0] || "No additional instructions available."}
              </p>

              <div className="mt-auto pt-4 hairline-t flex flex-wrap gap-2">
                {exercise.primaryMuscles.map((m: string) => (
                  <span key={m} className="px-2 py-1 bg-accent/10 border border-accent/20 text-[9px] font-semibold tracking-wider text-accent uppercase rounded-sm">
                    {m}
                  </span>
                ))}
                {exercise.equipment && (
                  <span className="px-2 py-1 bg-surface-border/30 border border-surface-border text-[9px] font-semibold tracking-wider text-mid uppercase rounded-sm">
                    {exercise.equipment}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-20 text-xs tracking-wider text-faint uppercase font-semibold">NO MATCHING EXERCISES FOUND.</div>
      )}

      {/* Pagination controls */}
      <div className="flex justify-between items-center surface-card hairline p-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-secondary disabled:opacity-50 text-xs"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> PREV
        </button>

        <span className="text-xs font-bold tracking-wider text-accent uppercase tabular-nums">
          PAGE {page} <span className="text-faint">/ {maxPage}</span>
        </span>

        <button
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          disabled={page >= maxPage}
          className="btn-secondary disabled:opacity-50 text-xs"
        >
          NEXT <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

