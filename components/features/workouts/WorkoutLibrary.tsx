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
  Zap,
  Activity,
  Layers,
  Flame,
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
    level: "intermediate",
    force: "push",
    instructions: [
      "Lie flat on your back on a sturdy flat bench.",
      "Grip the barbell with hands slightly wider than shoulder-width apart.",
      "Unrack the bar and slowly lower it with control to the center of your chest.",
      "Press the bar upward explosively by engaging your chest until arms are locked out.",
      "Keep feet planted flat on the floor throughout the entire movement."
    ],
    images: [
      "Barbell_Bench_Press_-_Medium_Grip/0.jpg",
      "Barbell_Bench_Press_-_Medium_Grip/1.jpg"
    ]
  },
  {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    category: "strength",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    equipment: "dumbbell",
    level: "beginner",
    force: "push",
    instructions: [
      "Set an adjustable bench to an incline angle between 30 and 45 degrees.",
      "Sit back with dumbbells resting vertically on your thighs, then kick them up to shoulder height.",
      "Press the dumbbells straight up in a smooth arc until your elbows are extended.",
      "Lower the dumbbells under full control until you feel a deep stretch in the upper chest.",
      "Repeat for desired repetitions with consistent tempo."
    ],
    images: [
      "Incline_Dumbbell_Press/0.jpg",
      "Incline_Dumbbell_Press/1.jpg"
    ]
  },
  {
    id: "barbell-squat",
    name: "Barbell Back Squat",
    category: "strength",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes", "hamstrings", "lower back"],
    equipment: "barbell",
    level: "intermediate",
    force: "push",
    instructions: [
      "Rest the barbell comfortably across your upper trapezius muscles.",
      "Place your feet slightly wider than shoulder-width with toes turned out 15 degrees.",
      "Inhale deeply, brace your core, and push your hips back as you bend your knees.",
      "Descend until your thighs are at least parallel to the gym floor.",
      "Drive hard through your heels and mid-foot to stand back up to full height."
    ],
    images: [
      "Barbell_Full_Squat/0.jpg",
      "Barbell_Full_Squat/1.jpg"
    ]
  },
  {
    id: "deadlift",
    name: "Conventional Deadlift",
    category: "strength",
    primaryMuscles: ["lower back"],
    secondaryMuscles: ["hamstrings", "glutes", "traps", "forearms"],
    equipment: "barbell",
    level: "intermediate",
    force: "pull",
    instructions: [
      "Stand with mid-foot directly beneath the barbell, feet hip-width apart.",
      "Hinge forward at hips and grab the bar just outside your knees with double overhand grip.",
      "Pull your chest up, flatten your back, and engage your lats to remove bar slack.",
      "Drive through the floor with your legs, keeping the barbell tight against your shins and thighs.",
      "Lock out hips and knees at top; return barbell to floor under control."
    ],
    images: [
      "Barbell_Deadlift/0.jpg",
      "Barbell_Deadlift/1.jpg"
    ]
  },
  {
    id: "pull-up",
    name: "Overhand Pull-Up",
    category: "strength",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "middle back"],
    equipment: "body only",
    level: "beginner",
    force: "pull",
    instructions: [
      "Grab an overhead pull-up bar with an overhand grip slightly wider than shoulder-width.",
      "Hang with arms fully extended and core tightly braced.",
      "Pull your elbows down toward your ribs until your chin clearly clears the bar.",
      "Pause briefly at top, then lower yourself under control back to full extension."
    ],
    images: [
      "Pullups/0.jpg",
      "Pullups/1.jpg"
    ]
  },
  {
    id: "overhead-press",
    name: "Standing Barbell Overhead Press",
    category: "strength",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps", "traps"],
    equipment: "barbell",
    level: "intermediate",
    force: "push",
    instructions: [
      "Rest barbell at collarbone level with elbows positioned slightly in front of bar.",
      "Tighten your abs, glutes, and thighs to form a rigid pillar.",
      "Press the barbell vertically in a straight path, moving your head slightly back as it passes your chin.",
      "Lock out arms overhead directly aligned over your mid-foot and spine."
    ],
    images: [
      "Standing_Military_Press/0.jpg",
      "Standing_Military_Press/1.jpg"
    ]
  },
  {
    id: "bicep-curl",
    name: "Dumbbell Bicep Curl",
    category: "strength",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: "dumbbell",
    level: "beginner",
    force: "pull",
    instructions: [
      "Stand tall holding dumbbells at your sides with palms facing each other.",
      "Keep elbows tucked tightly near your ribs without swinging your hips.",
      "Curl the weights upward while rotating palms to face up at top of movement.",
      "Squeeze biceps firmly for 1 second, then lower slowly back to full hang."
    ],
    images: [
      "Dumbbell_Bicep_Curl/0.jpg",
      "Dumbbell_Bicep_Curl/1.jpg"
    ]
  },
  {
    id: "tricep-pushdown",
    name: "Cable Tricep Pushdown",
    category: "strength",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "cable",
    level: "beginner",
    force: "push",
    instructions: [
      "Attach a rope or straight bar to a high cable pulley.",
      "Grip firmly, pin your upper arms against your ribs, and bend elbows to 90 degrees.",
      "Push down smoothly until your elbows are completely straightened and triceps fully contracted.",
      "Slowly let the cable rise back to 90 degrees without letting elbows drift forward."
    ],
    images: [
      "Triceps_Pushdown_-_V-Bar_Attachment/0.jpg",
      "Triceps_Pushdown_-_V-Bar_Attachment/1.jpg"
    ]
  }
];

// Complete list of all 17 primary muscle groups identified from dataset analysis
const RAW_MUSCLE_CONFIG = [
  { value: "quadriceps", label: "Quadriceps (Front Thigh)" },
  { value: "shoulders", label: "Shoulders (Deltoids)" },
  { value: "abdominals", label: "Abdominals & Core" },
  { value: "chest", label: "Chest (Pectorals)" },
  { value: "hamstrings", label: "Hamstrings (Back Thigh)" },
  { value: "triceps", label: "Triceps" },
  { value: "biceps", label: "Biceps" },
  { value: "lats", label: "Lats (Upper Back)" },
  { value: "middle back", label: "Middle Back" },
  { value: "calves", label: "Calves" },
  { value: "lower back", label: "Lower Back" },
  { value: "forearms", label: "Forearms & Grip" },
  { value: "glutes", label: "Glutes (Hips & Butt)" },
  { value: "traps", label: "Traps (Upper Back & Neck)" },
  { value: "adductors", label: "Adductors (Inner Thigh)" },
  { value: "abductors", label: "Abductors (Outer Thigh)" },
  { value: "neck", label: "Neck" },
];

// Complete list of all 11 equipment categories from dataset analysis
const RAW_EQUIPMENT_CONFIG = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "body only", label: "Bodyweight Only" },
  { value: "cable", label: "Cable Machine" },
  { value: "machine", label: "Gym Machine" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "bands", label: "Resistance Bands" },
  { value: "medicine ball", label: "Medicine Ball" },
  { value: "exercise ball", label: "Exercise Ball" },
  { value: "foam roll", label: "Foam Roller" },
  { value: "e-z curl bar", label: "E-Z Curl Bar" },
];

// All 7 exercise categories from dataset analysis
const RAW_CATEGORY_CONFIG = [
  { value: "strength", label: "Strength Training" },
  { value: "stretching", label: "Stretching & Mobility" },
  { value: "plyometrics", label: "Plyometrics & Power" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "olympic weightlifting", label: "Olympic Weightlifting" },
  { value: "strongman", label: "Strongman" },
  { value: "cardio", label: "Cardio & Conditioning" },
];

// All 3 experience levels
const RAW_LEVEL_CONFIG = [
  { value: "beginner", label: "Beginner Friendly" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Advanced / Expert" },
];

// All 3 mechanics forces
const RAW_FORCE_CONFIG = [
  { value: "push", label: "Push Movement" },
  { value: "pull", label: "Pull Movement" },
  { value: "static", label: "Static / Isometric Hold" },
];

const fetcher = async (): Promise<FreeExercise[]> => {
  // 1. First priority: High-speed local cached API route
  try {
    const res = await fetch("/api/exercises");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Continue to direct GitHub fallback
  }

  // 2. Second priority: Direct GitHub Raw upstream fetch
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Continue to fallback
  }

  return FALLBACK_EXERCISES;
};

export default function WorkoutLibrary() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("ALL");
  const [selectedEquipment, setSelectedEquipment] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedForce, setSelectedForce] = useState("ALL");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedExercise, setSelectedExercise] = useState<FreeExercise | null>(null);
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

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

  const { data: allExercises, isLoading } = useSWR("free-exercise-db", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  const exercises = useMemo(() => {
    return Array.isArray(allExercises) && allExercises.length > 0
      ? allExercises
      : FALLBACK_EXERCISES;
  }, [allExercises]);

  // Dynamically analyze exercises to compute exact counts for every single filter option
  const counts = useMemo(() => {
    const muscleMap: Record<string, number> = {};
    const equipmentMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const levelMap: Record<string, number> = {};
    const forceMap: Record<string, number> = {};

    for (const ex of exercises) {
      if (Array.isArray(ex.primaryMuscles)) {
        for (const m of ex.primaryMuscles) {
          const key = m.toLowerCase().trim();
          muscleMap[key] = (muscleMap[key] || 0) + 1;
        }
      }
      if (ex.equipment) {
        const key = ex.equipment.toLowerCase().trim();
        equipmentMap[key] = (equipmentMap[key] || 0) + 1;
      }
      if (ex.category) {
        const key = ex.category.toLowerCase().trim();
        categoryMap[key] = (categoryMap[key] || 0) + 1;
      }
      if (ex.level) {
        const key = ex.level.toLowerCase().trim();
        levelMap[key] = (levelMap[key] || 0) + 1;
      }
      if (ex.force) {
        const key = ex.force.toLowerCase().trim();
        forceMap[key] = (forceMap[key] || 0) + 1;
      }
    }

    return {
      total: exercises.length,
      muscles: muscleMap,
      equipment: equipmentMap,
      categories: categoryMap,
      levels: levelMap,
      forces: forceMap,
    };
  }, [exercises]);

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
    setSelectedEquipment("ALL");
    setSelectedCategory("ALL");
    setSelectedLevel("ALL");
    setSelectedForce("ALL");
    setPage(1);
  };

  const hasActiveFilter =
    debouncedSearch.trim() !== "" ||
    selectedMuscle !== "ALL" ||
    selectedEquipment !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedLevel !== "ALL" ||
    selectedForce !== "ALL";

  const activeFilterCount = [
    selectedMuscle !== "ALL",
    selectedEquipment !== "ALL",
    selectedCategory !== "ALL",
    selectedLevel !== "ALL",
    selectedForce !== "ALL",
  ].filter(Boolean).length;

  // Filter and Fuzzy Search
  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Filter by Target Muscle
    if (selectedMuscle !== "ALL") {
      result = result.filter(
        (ex) =>
          Array.isArray(ex.primaryMuscles) &&
          ex.primaryMuscles.some((m) => m.toLowerCase().trim() === selectedMuscle.toLowerCase())
      );
    }

    // Filter by Equipment
    if (selectedEquipment !== "ALL") {
      result = result.filter(
        (ex) => ex.equipment && ex.equipment.toLowerCase().trim() === selectedEquipment.toLowerCase()
      );
    }

    // Filter by Category / Type
    if (selectedCategory !== "ALL") {
      result = result.filter(
        (ex) => ex.category && ex.category.toLowerCase().trim() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Difficulty Level
    if (selectedLevel !== "ALL") {
      result = result.filter(
        (ex) => ex.level && ex.level.toLowerCase().trim() === selectedLevel.toLowerCase()
      );
    }

    // Filter by Force Type
    if (selectedForce !== "ALL") {
      result = result.filter(
        (ex) => ex.force && ex.force.toLowerCase().trim() === selectedForce.toLowerCase()
      );
    }

    // Apply Fuzzy Search if query is present
    if (debouncedSearch.trim()) {
      const searchTarget = debouncedSearch.trim();
      const fuzzyResults = fuzzysort.go(searchTarget, result, {
        keys: [
          (obj) => obj.name,
          (obj) => (obj.primaryMuscles || []).join(" "),
          (obj) => (obj.secondaryMuscles || []).join(" "),
          (obj) => obj.equipment || "",
          (obj) => obj.category || "",
        ],
        threshold: -10000,
      });
      return fuzzyResults.map((r) => r.obj);
    }

    return result;
  }, [
    exercises,
    selectedMuscle,
    selectedEquipment,
    selectedCategory,
    selectedLevel,
    selectedForce,
    debouncedSearch,
  ]);

  const totalCount = filteredExercises.length;
  const pageSize = 12;
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));

  // Paginated exercises slice
  const paginatedExercises = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExercises.slice(start, start + pageSize);
  }, [filteredExercises, page]);

  return (
    <div className="w-full space-y-6">
      {/* Search and Filters Hub */}
      <div className="p-4 sm:p-6 rounded-2xl bg-surface-card border border-surface-border/80 shadow-lg space-y-5">
        
        {/* Search Bar Row */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercises by name (e.g. Bench Press, Squat, Pull-Up, Biceps)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-surface-canvas border border-surface-border text-hi !pl-11 pr-10 py-3.5 rounded-xl focus:outline-none focus:border-accent text-sm font-medium transition-colors placeholder:text-mid/60 shadow-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-mid hover:text-hi cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Popular Muscle Bar (One-Tap Filtering) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mid shrink-0 mr-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-accent" />
            <span>Target:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedMuscle("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedMuscle === "ALL"
                ? "bg-accent text-white shadow-xs"
                : "bg-surface-canvas border border-surface-border text-mid hover:text-hi"
            }`}
          >
            All Muscles ({counts.total})
          </button>

          {[
            { val: "chest", name: "Chest" },
            { val: "quadriceps", name: "Quads / Legs" },
            { val: "shoulders", name: "Shoulders" },
            { val: "biceps", name: "Biceps" },
            { val: "triceps", name: "Triceps" },
            { val: "lats", name: "Back / Lats" },
            { val: "abdominals", name: "Abs & Core" },
          ].map((m) => {
            const count = counts.muscles[m.val] || 0;
            const isSelected = selectedMuscle === m.val;
            return (
              <button
                key={m.val}
                type="button"
                onClick={() => {
                  setSelectedMuscle(m.val);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-accent text-white font-bold shadow-xs"
                    : "bg-surface-canvas border border-surface-border text-mid hover:text-hi"
                }`}
              >
                <span>{m.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-black/30 text-white" : "bg-surface-border/60 text-mid"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Primary Filter Selectors: Target Muscle + Equipment + Training Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          
          {/* Target Muscle Dropdown (All 17 Muscles Analyzed) */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-accent mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-accent" />
                <span>Primary Muscle</span>
              </span>
              <span className="text-[10px] text-mid font-normal">
                {counts.muscles[selectedMuscle] ? `${counts.muscles[selectedMuscle]} available` : `${counts.total} total`}
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedMuscle}
                onChange={(e) => {
                  setSelectedMuscle(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-3.5 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10 shadow-xs"
              >
                <option value="ALL" className="bg-surface-card text-hi">
                  All Muscles ({counts.total})
                </option>
                {RAW_MUSCLE_CONFIG.map((m) => {
                  const count = counts.muscles[m.value] || 0;
                  return (
                    <option key={m.value} value={m.value} className="bg-surface-card text-hi">
                      {m.label} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
            </div>
          </div>

          {/* Equipment Dropdown (All 11 Equipment Types Analyzed) */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-mid mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-accent" />
                <span>Equipment</span>
              </span>
              <span className="text-[10px] text-mid font-normal">
                {counts.equipment[selectedEquipment] ? `${counts.equipment[selectedEquipment]} available` : "All Gear"}
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedEquipment}
                onChange={(e) => {
                  setSelectedEquipment(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-3.5 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10 shadow-xs"
              >
                <option value="ALL" className="bg-surface-card text-hi">
                  All Equipment ({counts.total})
                </option>
                {RAW_EQUIPMENT_CONFIG.map((eq) => {
                  const count = counts.equipment[eq.value] || 0;
                  return (
                    <option key={eq.value} value={eq.value} className="bg-surface-card text-hi">
                      {eq.label} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
            </div>
          </div>

          {/* Training Category Dropdown (All 7 Categories Analyzed) */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-mid mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span>Training Type</span>
              </span>
              <span className="text-[10px] text-mid font-normal">
                {counts.categories[selectedCategory] ? `${counts.categories[selectedCategory]} available` : "All Types"}
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-3.5 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10 shadow-xs"
              >
                <option value="ALL" className="bg-surface-card text-hi">
                  All Training Types ({counts.total})
                </option>
                {RAW_CATEGORY_CONFIG.map((c) => {
                  const count = counts.categories[c.value] || 0;
                  return (
                    <option key={c.value} value={c.value} className="bg-surface-card text-hi">
                      {c.label} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Secondary / Advanced Filters Toggle (Level & Force) */}
        <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-surface-border/50">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent hover:brightness-110 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAdvancedFilters ? "Hide Advanced Filters" : "More Filters (Level & Movement Force)"}</span>
            {showAdvancedFilters ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {activeFilterCount > 0 && !showAdvancedFilters && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-accent/20 text-accent text-[10px]">
                {activeFilterCount} Active
              </span>
            )}
          </button>

          {/* Exercise Counter Summary */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs text-mid">
              <span className="font-bold text-hi tabular-nums">{totalCount}</span>
              <span className="text-faint font-normal"> / {counts.total} exercises</span>
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-canvas border border-surface-border hover:border-accent text-xs font-semibold text-mid hover:text-hi transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-accent" />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 animate-in fade-in duration-200">
            {/* Experience Level */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-mid mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-accent" />
                  <span>Difficulty Level</span>
                </span>
                <span className="text-[10px] text-mid font-normal">
                  {counts.levels[selectedLevel] ? `${counts.levels[selectedLevel]} available` : "All"}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-3.5 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10 shadow-xs"
                >
                  <option value="ALL" className="bg-surface-card text-hi">
                    All Difficulty Levels ({counts.total})
                  </option>
                  {RAW_LEVEL_CONFIG.map((lvl) => {
                    const count = counts.levels[lvl.value] || 0;
                    return (
                      <option key={lvl.value} value={lvl.value} className="bg-surface-card text-hi">
                        {lvl.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
              </div>
            </div>

            {/* Movement Force Type (Push / Pull / Static) */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-mid mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Mechanic / Movement Force</span>
                </span>
                <span className="text-[10px] text-mid font-normal">
                  {counts.forces[selectedForce] ? `${counts.forces[selectedForce]} available` : "All"}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedForce}
                  onChange={(e) => {
                    setSelectedForce(e.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none bg-surface-canvas border border-surface-border text-hi text-xs font-semibold px-3.5 py-3 rounded-xl focus:outline-none focus:border-accent cursor-pointer pr-10 shadow-xs"
                >
                  <option value="ALL" className="bg-surface-card text-hi">
                    All Movement Forces ({counts.total})
                  </option>
                  {RAW_FORCE_CONFIG.map((f) => {
                    const count = counts.forces[f.value] || 0;
                    return (
                      <option key={f.value} value={f.value} className="bg-surface-card text-hi">
                        {f.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mid pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Badges */}
        {hasActiveFilter && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-border/40">
            <span className="text-[11px] font-bold text-mid uppercase tracking-wider">Active:</span>

            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-canvas border border-surface-border text-xs text-hi font-medium">
                <span>Keyword: &quot;{debouncedSearch}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-mid hover:text-accent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedMuscle !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/15 border border-accent/30 text-xs text-accent font-bold uppercase">
                <span>{selectedMuscle}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMuscle("ALL")}
                  className="hover:opacity-75 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedEquipment !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-canvas border border-surface-border text-xs text-hi font-medium uppercase">
                <span>Gear: {selectedEquipment}</span>
                <button
                  type="button"
                  onClick={() => setSelectedEquipment("ALL")}
                  className="text-mid hover:text-accent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedCategory !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-canvas border border-surface-border text-xs text-hi font-medium uppercase">
                <span>Type: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className="text-mid hover:text-accent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedLevel !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-canvas border border-surface-border text-xs text-hi font-medium uppercase">
                <span>Level: {selectedLevel}</span>
                <button
                  type="button"
                  onClick={() => setSelectedLevel("ALL")}
                  className="text-mid hover:text-accent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedForce !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-canvas border border-surface-border text-xs text-hi font-medium uppercase">
                <span>Force: {selectedForce}</span>
                <button
                  type="button"
                  onClick={() => setSelectedForce("ALL")}
                  className="text-mid hover:text-accent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}

      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 text-center rounded-2xl bg-surface-card border border-surface-border">
          <div className="w-8 h-8 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-mid font-medium">Loading comprehensive workout catalog...</p>
        </div>
      )}

      {/* Exercise Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedExercises.map((exercise: FreeExercise) => {
            const isExpanded = Boolean(expandedIds[exercise.id]);
            const imagePath = exercise.images && exercise.images.length > 0 ? exercise.images[0] : null;
            const fullImageUrl = imagePath ? resolveExerciseImage(imagePath) : null;
            const isImageBroken = failedImages[exercise.id];

            return (
              <div
                key={exercise.id}
                className="rounded-2xl bg-surface-card border border-surface-border/80 overflow-hidden hover:border-accent/60 transition-all duration-200 flex flex-col h-full shadow-md group"
              >
                {/* Visual Demonstration Image Container */}
                <div
                  onClick={() => setSelectedExercise(exercise)}
                  className="aspect-video bg-[#0c0c0e] relative overflow-hidden cursor-pointer group/img"
                  title="Click to see high-res demonstration angles and full guide"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedExercise(exercise);
                    }
                  }}
                >
                  {fullImageUrl && !isImageBroken ? (
                    <Image
                      src={fullImageUrl}
                      alt={exercise.name}
                      fill
                      unoptimized={true}
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [exercise.id]: true }));
                      }}
                      className="object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90 group-hover/img:opacity-100"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-canvas/80 text-mid gap-2">
                      <Dumbbell className="w-10 h-10 text-accent/50" />
                      <span className="text-[11px] font-semibold text-mid uppercase tracking-wider">
                        {exercise.name}
                      </span>
                    </div>
                  )}

                  {/* Training Category Pill */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-accent uppercase tracking-wider shadow-sm z-10">
                    {exercise.category || "STRENGTH"}
                  </div>

                  {/* Level Pill in bottom-left */}
                  {exercise.level && (
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[9px] font-bold uppercase tracking-wider text-hi z-10">
                      {exercise.level}
                    </div>
                  )}

                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[1px] z-10">
                    <Maximize2 className="w-4 h-4 text-accent" />
                    <span>View Demonstration &amp; Steps</span>
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

                    {/* Muscle & Equipment Badges */}
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
                      {exercise.force && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border/60 text-[10px] font-semibold tracking-wider text-mid uppercase">
                          {exercise.force}
                        </span>
                      )}
                    </div>

                    {/* Instruction Preview or Expanded Instructions */}
                    <div className="mt-3.5">
                      {!isExpanded ? (
                        <p className="text-xs text-mid leading-relaxed line-clamp-2">
                          {exercise.instructions?.[0] || "Step-by-step movement instructions available inside."}
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
                              <span className="text-[10px] font-bold uppercase tracking-wider text-mid block mb-1">
                                Secondary Muscles Involved:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {exercise.secondaryMuscles.map((sm) => (
                                  <span
                                    key={sm}
                                    className="px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-[9px] text-mid uppercase"
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

                  {/* Actions Row */}
                  <div className="mt-4 pt-3.5 border-t border-surface-border/50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(exercise.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:brightness-110 transition-all cursor-pointer"
                    >
                      <span>{isExpanded ? "Collapse Guide" : "Read Steps"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedExercise(exercise)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-canvas border border-surface-border hover:border-accent text-xs font-semibold text-hi hover:text-accent transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3 text-accent" />
                      <span>Enlarge View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results State */}
      {!isLoading && filteredExercises.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-surface-card border border-surface-border shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent mx-auto flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl uppercase tracking-wide text-hi">
            No Exercises Found
          </h3>
          <p className="text-xs text-mid max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any exercises matching your active filters. Try adjusting your target muscle, equipment, or resetting filters.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-canvas border border-surface-border hover:border-accent text-xs font-bold text-hi disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-canvas border border-surface-border hover:border-accent text-xs font-bold text-hi disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* High-Resolution Visual Modal Dialog */}
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
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <h3 className="font-display text-lg uppercase tracking-wide text-hi line-clamp-1">
                  {selectedExercise.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="p-1.5 rounded-xl bg-surface-canvas border border-surface-border text-mid hover:text-hi hover:border-accent transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-6">
              
              {/* High-Res Visual Demonstration */}
              {selectedExercise.images && selectedExercise.images.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="relative w-full aspect-video bg-[#0a0a0c] rounded-xl overflow-hidden border border-surface-border">
                    <Image
                      src={resolveExerciseImage(
                        selectedExercise.images[activeModalImageIndex] || selectedExercise.images[0]
                      )}
                      alt={selectedExercise.name}
                      fill
                      unoptimized={true}
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
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                            activeModalImageIndex === imgIdx
                              ? "bg-accent text-white shadow-xs"
                              : "bg-surface-canvas border border-surface-border text-mid hover:text-hi"
                          }`}
                        >
                          {imgIdx === 0 ? "Start Position" : imgIdx === 1 ? "Peak Contraction" : `Angle ${imgIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video bg-surface-canvas rounded-xl flex items-center justify-center border border-surface-border text-mid">
                  <Dumbbell className="w-12 h-12 text-accent/40" />
                </div>
              )}

              {/* Complete Metadata Tags */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-surface-border/60">
                {selectedExercise.primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/40 text-xs font-bold text-accent uppercase"
                  >
                    Primary: {m}
                  </span>
                ))}
                {selectedExercise.equipment && (
                  <span className="px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-xs font-medium text-hi uppercase">
                    Gear: {selectedExercise.equipment}
                  </span>
                )}
                {selectedExercise.category && (
                  <span className="px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-xs font-medium text-mid uppercase">
                    Type: {selectedExercise.category}
                  </span>
                )}
                {selectedExercise.level && (
                  <span className="px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-xs font-medium text-mid uppercase">
                    Level: {selectedExercise.level}
                  </span>
                )}
                {selectedExercise.force && (
                  <span className="px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-xs font-medium text-mid uppercase">
                    Force: {selectedExercise.force}
                  </span>
                )}
              </div>

              {/* Step-by-Step Movement Instructions */}
              <div className="space-y-3 pt-2 border-t border-surface-border/60">
                <h4 className="font-display text-sm uppercase tracking-wider text-accent flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Execution Guide:</span>
                </h4>
                <ol className="space-y-3">
                  {(selectedExercise.instructions || ["Perform movement with controlled form."]).map(
                    (step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-hi leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    )
                  )}
                </ol>
              </div>

              {/* Secondary Muscles & Advice */}
              {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-surface-border/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mid">
                    Secondary Muscles Recruited:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExercise.secondaryMuscles.map((sm) => (
                      <span
                        key={sm}
                        className="px-2 py-0.5 rounded-md bg-surface-canvas border border-surface-border text-xs text-mid uppercase"
                      >
                        {sm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach Tip */}
              <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 text-xs text-hi leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="text-accent uppercase tracking-wider block mb-0.5">Coach Tip:</strong>
                  Focus on smooth tempo and full range of motion. Never sacrifice strict form for heavier weight.
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
