"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Maximize2,
  X,
  Filter,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import useSWR from "swr";
import fuzzysort from "fuzzysort";
import type { FreeExercise } from "@/lib/fitness-data-service";

// The free-exercise-db JSON ships relative image paths like "3_4_Sit-Up/0.jpg".
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

function resolveExerciseImage(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `${IMAGE_BASE}${path}`;
}

const FALLBACK_EXERCISES: FreeExercise[] = [
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    category: "strength",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    equipment: "barbell",
    instructions: [
      "Lie flat on your back on a sturdy flat bench.",
      "Grip the barbell with hands slightly wider than shoulder-width apart.",
      "Unrack the bar and slowly lower it with control to the center of your chest.",
      "Press the bar upward explosively by engaging your chest until arms are locked out.",
      "Keep feet planted flat on the floor throughout the entire movement."
    ],
    images: []
  },
  {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    category: "strength",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    equipment: "dumbbell",
    instructions: [
      "Set an adjustable bench to an incline angle between 30 and 45 degrees.",
      "Sit back with dumbbells resting vertically on your thighs, then kick them up to shoulder height.",
      "Press the dumbbells straight up in a smooth arc until your elbows are extended.",
      "Lower the dumbbells under full control until you feel a deep stretch in the upper chest.",
      "Repeat for desired repetitions with consistent tempo."
    ],
    images: []
  },
  {
    id: "barbell-squat",
    name: "Barbell Back Squat",
    category: "strength",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes", "hamstrings", "lower back"],
    equipment: "barbell",
    instructions: [
      "Rest the barbell comfortably across your upper trapezius muscles.",
      "Place your feet slightly wider than shoulder-width with toes turned out 15 degrees.",
      "Inhale deeply, brace your core, and push your hips back as you bend your knees.",
      "Descend until your thighs are at least parallel to the gym floor.",
      "Drive hard through your heels and mid-foot to stand back up to full height."
    ],
    images: []
  },
  {
    id: "deadlift",
    name: "Conventional Deadlift",
    category: "strength",
    primaryMuscles: ["lower back"],
    secondaryMuscles: ["hamstrings", "glutes", "traps", "forearms"],
    equipment: "barbell",
    instructions: [
      "Stand with mid-foot directly beneath the barbell, feet hip-width apart.",
      "Hinge forward at hips and grab the bar just outside your knees with double overhand grip.",
      "Pull your chest up, flatten your back, and engage your lats to remove bar slack.",
      "Drive through the floor with your legs, keeping the barbell tight against your shins and thighs.",
      "Lock out hips and knees at top; return barbell to floor under control."
    ],
    images: []
  },
  {
    id: "pull-up",
    name: "Overhand Pull-Up",
    category: "strength",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "middle back"],
    equipment: "body only",
    instructions: [
      "Grab an overhead pull-up bar with an overhand grip slightly wider than shoulder-width.",
      "Hang with arms fully extended and core tightly braced.",
      "Pull your elbows down toward your ribs until your chin clearly clears the bar.",
      "Pause briefly at top, then lower yourself under control back to full extension."
    ],
    images: []
  },
  {
    id: "overhead-press",
    name: "Standing Barbell Overhead Press",
    category: "strength",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps", "traps"],
    equipment: "barbell",
    instructions: [
      "Rest barbell at collarbone level with elbows positioned slightly in front of bar.",
      "Tighten your abs, glutes, and thighs to form a rigid pillar.",
      "Press the barbell vertically in a straight path, moving your head slightly back as it passes your chin.",
      "Lock out arms overhead directly aligned over your mid-foot and spine."
    ],
    images: []
  },
  {
    id: "bicep-curl",
    name: "Dumbbell Bicep Curl",
    category: "strength",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: "dumbbell",
    instructions: [
      "Stand tall holding dumbbells at your sides with palms facing each other.",
      "Keep elbows tucked tightly near your ribs without swinging your hips.",
      "Curl the weights upward while rotating palms to face up at top of movement.",
      "Squeeze biceps firmly for 1 second, then lower slowly back to full hang."
    ],
    images: []
  },
  {
    id: "tricep-pushdown",
    name: "Cable Tricep Pushdown",
    category: "strength",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "cable",
    instructions: [
      "Attach a rope or straight bar to a high cable pulley.",
      "Grip firmly, pin your upper arms against your ribs, and bend elbows to 90 degrees.",
      "Push down smoothly until your elbows are completely straightened and triceps fully contracted.",
      "Slowly let the cable rise back to 90 degrees without letting elbows drift forward."
    ],
    images: []
  }
];

const MUSCLE_OPTIONS = [
  { value: "ALL", label: "All Muscles (Complete Body)" },
  { value: "chest", label: "Chest (Pectorals)" },
  { value: "lats", label: "Lats (Upper Back)" },
  { value: "middle back", label: "Middle Back" },
  { value: "lower back", label: "Lower Back" },
  { value: "traps", label: "Traps (Upper Back / Neck)" },
  { value: "shoulders", label: "Shoulders (Deltoids)" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "forearms", label: "Forearms & Grip" },
  { value: "quadriceps", label: "Quadriceps (Front Thigh)" },
  { value: "hamstrings", label: "Hamstrings (Back Thigh)" },
  { value: "glutes", label: "Glutes (Hips & Butt)" },
  { value: "calves", label: "Calves" },
  { value: "abdominals", label: "Abdominals & Core" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "strength", label: "Strength Training" },
  { value: "cardio", label: "Cardio & Conditioning" },
  { value: "stretching", label: "Stretching & Mobility" },
  { value: "plyometrics", label: "Plyometrics & Power" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "strongman", label: "Strongman" },
];

const fetcher = async (): Promise<FreeExercise[]> => {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
    );
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
  const [selectedMuscle, setSelectedMuscle] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedExercise, setSelectedExercise] = useState<FreeExercise | null>(null);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  // Modal ESC key listener & body lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedExercise(null);
      }
    };

    if (selectedExercise) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setActiveModalImageIndex(0);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedExercise]);

  const { data: allExercises, error, isLoading } = useSWR("free-exercise-db", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  const exercises = useMemo(() => allExercises || [], [allExercises]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedMuscle("ALL");
    setSelectedCategory("ALL");
    setPage(1);
  };

  const filteredExercises = useMemo(() => {
    let pool = exercises;

    if (debouncedSearch.trim()) {
      const fuzzyResults = fuzzysort.go(debouncedSearch.trim(), exercises, {
        keys: [
          "name",
          "category",
          "equipment",
          (obj: FreeExercise) => obj.primaryMuscles.join(" "),
          (obj: FreeExercise) => (obj.secondaryMuscles || []).join(" "),
        ],
        threshold: -500,
      });
      pool = fuzzyResults.map((r) => r.obj);
    }

    return pool.filter((ex: FreeExercise) => {
      // Muscle filter
      if (selectedMuscle !== "ALL") {
        const mTarget = selectedMuscle.toLowerCase();
        const primaryMatch = ex.primaryMuscles?.some((m) =>
          m.toLowerCase().includes(mTarget)
        );
        const secondaryMatch = ex.secondaryMuscles?.some((m) =>
          m.toLowerCase().includes(mTarget)
        );
        if (!primaryMatch && !secondaryMatch) return false;
      }

      // Category filter
      if (selectedCategory !== "ALL") {
        if (ex.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [exercises, debouncedSearch, selectedMuscle, selectedCategory]);

  const pageSize = 18;
  const totalCount = filteredExercises.length;
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedExercises = useMemo(
    () => filteredExercises.slice((page - 1) * pageSize, page * pageSize),
    [filteredExercises, page]
  );

  const hasActiveFilter =
    Boolean(debouncedSearch.trim()) || selectedMuscle !== "ALL" || selectedCategory !== "ALL";

  if (isLoading && !allExercises) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-accent">
          Loading 1,300+ Exercise Vault...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 rounded-2xl bg-surface-card border border-status-danger/40 text-status-danger text-xs font-semibold max-w-lg mx-auto">
        Could not connect to online exercise database. Showing offline essentials.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search & Modern Filter Controls Dock */}
      <div className="p-5 sm:p-7 rounded-2xl bg-surface-card border border-surface-border shadow-lg space-y-4">
        
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercises by name, equipment (e.g. Bench Press, Dumbbell, Squat)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-canvas border border-surface-border text-hi !pl-11 pr-10 py-3.5 rounded-xl focus:outline-none focus:border-accent text-sm font-medium transition-colors placeholder:text-mid/60"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-mid hover:text-hi"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Row: Muscle Dropdown + Category Selector + Clear */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Target Muscle Dropdown Filter */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-accent mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-accent" />
              <span>Target Muscle</span>
            </label>
            <div className="relative">
              <select
                value={selectedMuscle}
                onChange={(e) => {
                  setSelectedMuscle(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10"
              >
                {MUSCLE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-surface-card text-hi">
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
            </div>
          </div>

          {/* Workout Category Dropdown */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-mid mb-1.5 flex items-center gap-1.5">
              <Dumbbell className="w-3 h-3 text-accent" />
              <span>Training Type</span>
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value} className="bg-surface-card text-hi">
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
            </div>
          </div>

          {/* Quick Active Filter Summary & Reset */}
          <div className="flex sm:col-span-2 lg:col-span-1 items-end justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
            <div className="text-xs text-mid flex flex-col justify-end">
              <span className="font-bold text-hi tabular-nums">
                {totalCount} <span className="text-mid font-normal">exercises found</span>
              </span>
              <span className="text-[10px] text-faint">Page {page} of {maxPage}</span>
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-canvas border border-surface-border hover:border-accent/60 text-xs font-semibold text-mid hover:text-hi transition-all shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-accent" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedExercises.map((exercise: FreeExercise) => {
          const isExpanded = Boolean(expandedIds[exercise.id]);
          const hasImages = exercise.images && exercise.images.length > 0;

          return (
            <div
              key={exercise.id}
              className="rounded-2xl bg-surface-card border border-surface-border/80 overflow-hidden hover:border-accent/60 transition-all duration-200 flex flex-col h-full shadow-md group"
            >
              {/* Image Section (Interactive on Tap/Click) */}
              <div
                onClick={() => setSelectedExercise(exercise)}
                className="aspect-video bg-surface-canvas relative overflow-hidden cursor-pointer group/img"
                title="Tap to see full image and step-by-step guide"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedExercise(exercise);
                  }
                }}
              >
                {hasImages ? (
                  <Image
                    src={resolveExerciseImage(exercise.images![0])}
                    alt={exercise.name}
                    fill
                    className="object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90 group-hover/img:opacity-100"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-canvas">
                    <Dumbbell className="w-12 h-12 text-surface-border" />
                  </div>
                )}

                {/* Category Pill in top-right */}
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-accent uppercase tracking-wider shadow-sm z-10">
                  {exercise.category || "STRENGTH"}
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[1px]">
                  <Maximize2 className="w-4 h-4 text-accent" />
                  <span>Tap to Enlarge &amp; Steps</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                  {/* Exercise Title */}
                  <h3
                    className="font-display text-lg uppercase tracking-wide text-hi line-clamp-1 group-hover:text-accent transition-colors"
                    title={exercise.name}
                  >
                    {exercise.name}
                  </h3>

                  {/* Muscle & Equipment Tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    {exercise.primaryMuscles.map((m: string) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 text-[10px] font-bold tracking-wider text-accent uppercase"
                      >
                        {m}
                      </span>
                    ))}
                    {exercise.equipment && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-[10px] font-semibold tracking-wider text-mid uppercase">
                        {exercise.equipment}
                      </span>
                    )}
                  </div>

                  {/* Instruction Preview or Full Instructions */}
                  <div className="mt-3.5">
                    {!isExpanded ? (
                      <p className="text-xs text-mid leading-relaxed line-clamp-2">
                        {exercise.instructions?.[0] || "Step instructions available inside."}
                      </p>
                    ) : (
                      <div className="space-y-2 pt-2 border-t border-surface-border/60 animate-in fade-in duration-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-accent block">
                          Full Workout Steps:
                        </span>
                        <ol className="space-y-2 text-xs text-hi leading-relaxed">
                          {(exercise.instructions || ["Perform movement with controlled form."]).map(
                            (step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            )
                          )}
                        </ol>

                        {/* Secondary muscles if available */}
                        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] uppercase tracking-wider text-faint block mb-1">
                              Also Targets:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {exercise.secondaryMuscles.map((sm) => (
                                <span
                                  key={sm}
                                  className="px-2 py-0.5 rounded-md bg-surface-canvas text-[9px] text-mid uppercase"
                                >
                                  {sm}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prominent MORE / EXPAND Button */}
                <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(exercise.id)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                      isExpanded
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "bg-surface-canvas border-surface-border hover:border-accent/60 hover:bg-accent/10 text-hi"
                    }`}
                  >
                    <span>{isExpanded ? "Hide Steps" : "More Instructions & Steps"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-accent" />
                    )}
                  </button>

                  {/* Photo zoom trigger icon button */}
                  <button
                    type="button"
                    onClick={() => setSelectedExercise(exercise)}
                    className="p-2 rounded-xl bg-surface-canvas border border-surface-border hover:border-accent hover:text-accent text-mid transition-all shrink-0"
                    title="View full-size photo & modal guide"
                    aria-label="View photo and full guide"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredExercises.length === 0 && (
        <div className="text-center py-20 p-8 rounded-2xl bg-surface-card border border-surface-border max-w-md mx-auto space-y-3">
          <Dumbbell className="w-10 h-10 text-mid mx-auto opacity-50" />
          <h4 className="font-display text-lg uppercase text-hi">No Exercises Match</h4>
          <p className="text-xs text-mid leading-relaxed">
            Try adjusting your search terms or choose a different muscle group from the dropdown.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:brightness-110"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {maxPage > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
          <button
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 120, behavior: "smooth" });
            }}
            disabled={page === 1}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-canvas border border-surface-border hover:border-accent text-xs font-bold text-hi disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-xs font-bold tracking-wider text-hi uppercase flex items-center gap-2">
            <span>Page <span className="text-accent">{page}</span> of {maxPage}</span>
            <span className="text-faint text-[11px]">({totalCount} total)</span>
          </div>

          <button
            onClick={() => {
              setPage((p) => Math.min(maxPage, p + 1));
              window.scrollTo({ top: 120, behavior: "smooth" });
            }}
            disabled={page >= maxPage}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-canvas border border-surface-border hover:border-accent text-xs font-bold text-hi disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full-Screen / Centered Image & Step Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-y-auto flex flex-col text-hi"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-surface-card/95 backdrop-blur-md border-b border-surface-border">
              <div className="flex items-center gap-2 pr-4">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h3 className="font-display text-lg uppercase tracking-wide text-hi line-clamp-1">
                  {selectedExercise.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="p-1.5 rounded-xl bg-surface-canvas border border-surface-border text-mid hover:text-hi hover:border-accent transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-6">
              
              {/* High-Res Visual Demonstration */}
              {selectedExercise.images && selectedExercise.images.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-surface-border">
                    <Image
                      src={resolveExerciseImage(
                        selectedExercise.images[activeModalImageIndex] || selectedExercise.images[0]
                      )}
                      alt={selectedExercise.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  </div>

                  {/* Multiple image angles indicator / selector */}
                  {selectedExercise.images.length > 1 && (
                    <div className="flex items-center gap-2 justify-center pt-1">
                      {selectedExercise.images.map((_, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => setActiveModalImageIndex(imgIdx)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                            activeModalImageIndex === imgIdx
                              ? "bg-accent text-white"
                              : "bg-surface-canvas border border-surface-border text-mid hover:text-hi"
                          }`}
                        >
                          Angle {imgIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl bg-surface-canvas border border-surface-border flex items-center justify-center">
                  <Dumbbell className="w-14 h-14 text-surface-border" />
                </div>
              )}

              {/* Key Specs Pills */}
              <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-surface-canvas border border-surface-border">
                <div className="flex items-center gap-1.5 text-xs text-mid">
                  <span className="text-[10px] uppercase tracking-wider text-faint font-bold">Category:</span>
                  <span className="font-bold text-accent uppercase">{selectedExercise.category || "Strength"}</span>
                </div>
                {selectedExercise.equipment && (
                  <div className="flex items-center gap-1.5 text-xs text-mid pl-3 border-l border-surface-border">
                    <span className="text-[10px] uppercase tracking-wider text-faint font-bold">Equipment:</span>
                    <span className="font-semibold text-hi uppercase">{selectedExercise.equipment}</span>
                  </div>
                )}
              </div>

              {/* Muscle Targets */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent block">
                  Muscles Worked:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.primaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30 text-xs font-bold text-accent uppercase tracking-wide flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Primary: {m}</span>
                    </span>
                  ))}
                  {(selectedExercise.secondaryMuscles || []).map((sm) => (
                    <span
                      key={sm}
                      className="px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-xs font-medium text-mid uppercase tracking-wide"
                    >
                      Secondary: {sm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Full Step-by-Step Instructions */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-hi block">
                  Step-by-Step Form &amp; Movement Instructions:
                </span>
                <ol className="space-y-3">
                  {(selectedExercise.instructions || ["Follow standard gym form and breathe with control."]).map(
                    (step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-surface-canvas/60 border border-surface-border text-xs text-hi leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-[11px] flex items-center justify-center border border-accent/30 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    )
                  )}
                </ol>
              </div>

              {/* Coaching Cue Advice */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/25 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs text-hi leading-relaxed">
                  <span className="font-bold text-accent block uppercase tracking-wider mb-0.5">
                    Coach Cue from Aman &amp; Pradeep:
                  </span>
                  Always warm up before lifting heavy. Control the weight on the way down, breathe out as you push, and never sacrifice form for ego lifting.
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-card border-t border-surface-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm"
              >
                Close Guide
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
