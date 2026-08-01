"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import Image from "next/image";
import { fetchFreeExerciseDb, FreeExercise } from "@/lib/fitness-data-service";

const fetcher = () => fetchFreeExerciseDb();

export default function WorkoutLibrary() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("");
    const [selectedMuscle, setSelectedMuscle] = useState<string>("");

    const { data: allExercises, error, isLoading } = useSWR('free-exercise-db', fetcher);

    if (isLoading && !allExercises) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="h-40 skeleton" />
                    <div className="p-4 space-y-3">
                        <div className="h-5 skeleton rounded w-3/4" />
                        <div className="h-3 skeleton rounded w-1/2" />
                        <div className="flex gap-2">
                            <div className="h-6 skeleton rounded w-16" />
                            <div className="h-6 skeleton rounded w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (error) return (
        <div className="text-center p-10 border border-red-500/50 bg-red-500/10 text-red-500 font-mono">
            UPLINK FAILURE: UNABLE TO RETRIEVE TACTICAL EXERCISE DATA.
        </div>
    );

    const exercises = allExercises || [];

    // Filter by search, category & individual muscle
    const filteredExercises = exercises.filter((ex: FreeExercise) => {
        const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) || ex.primaryMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = !category || ex.category.toLowerCase() === category.toLowerCase();
        const matchesMuscle = !selectedMuscle || 
            (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(selectedMuscle.toLowerCase()))) ||
            (ex.secondaryMuscles && ex.secondaryMuscles.some(m => m.toLowerCase().includes(selectedMuscle.toLowerCase())));

        return matchesSearch && matchesCategory && matchesMuscle;
    });

    const pageSize = 18;
    const totalCount = filteredExercises.length;
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    const paginatedExercises = filteredExercises.slice((page - 1) * pageSize, page * pageSize);

    // Extract categories
    const categories = Array.from(new Set(exercises.map(ex => ex.category))).sort();

    // Muscle Group Options
    const muscleGroups = [
        { label: "ALL MUSCLES", value: "" },
        { label: "CHEST", value: "chest" },
        { label: "TRICEPS", value: "triceps" },
        { label: "BICEPS", value: "biceps" },
        { label: "BACK / LATS", value: "lats" },
        { label: "SHOULDERS", value: "shoulders" },
        { label: "LEGS / QUADS", value: "quadriceps" },
        { label: "ABS / CORE", value: "abdominis" },
        { label: "GLUTES", value: "glutes" },
        { label: "HAMSTRINGS", value: "hamstrings" },
        { label: "FOREARMS", value: "forearms" },
    ];

    // Discipline / Exercise Type Options
    const disciplines = [
        { label: "ALL TYPES", value: "" },
        { label: "STRENGTH", value: "strength" },
        { label: "CARDIO", value: "cardio" },
        { label: "STRETCHING", value: "stretching" },
        { label: "POWERLIFTING", value: "powerlifting" },
        { label: "PLYOMETRICS", value: "plyometrics" },
        { label: "STRONGMAN", value: "strongman" },
        { label: "WEIGHTLIFTING", value: "olympic weightlifting" },
    ];

    return (
        <div className="space-y-8">
            {/* Controls Header with Search & 2 Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white/5 p-6 border border-white/10 rounded-xl">
                {/* Search Input */}
                <div className="relative md:col-span-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="SEARCH EXERCISES OR MUSCLES..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-black border border-white/20 pl-11 pr-4 py-3.5 text-white focus:border-gym-red focus:outline-none rounded-lg font-mono text-sm placeholder:text-gray-600 shadow-inner"
                    />
                </div>

                {/* Dropdown 1: Target Muscle Group */}
                <div className="relative md:col-span-3">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-red" />
                    <select
                        value={selectedMuscle}
                        onChange={(e) => {
                            setSelectedMuscle(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-black border border-white/20 pl-10 pr-8 py-3.5 text-white focus:border-gym-red focus:outline-none rounded-lg font-mono text-xs tracking-wider appearance-none cursor-pointer uppercase"
                    >
                        {muscleGroups.map((m) => (
                            <option key={m.label} value={m.value} className="bg-black text-white py-2">
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                </div>

                {/* Dropdown 2: Exercise Type / Category */}
                <div className="relative md:col-span-3">
                    <Dumbbell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-red" />
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-black border border-white/20 pl-10 pr-8 py-3.5 text-white focus:border-gym-red focus:outline-none rounded-lg font-mono text-xs tracking-wider appearance-none cursor-pointer uppercase"
                    >
                        {disciplines.map((d) => (
                            <option key={d.label} value={d.value} className="bg-black text-white py-2">
                                {d.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {paginatedExercises.map((exercise: FreeExercise) => (
                        <motion.div
                            key={exercise.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className="bg-black border border-white/10 rounded-xl overflow-hidden hover:border-gym-red/50 transition-all group flex flex-col h-full"
                        >
                            {/* Image Section */}
                            <div className="aspect-video bg-white/5 relative overflow-hidden">
                                {exercise.images && exercise.images.length > 0 ? (
                                    <Image
                                        src={exercise.images[0]}
                                        alt={exercise.name}
                                        fill
                                        className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Dumbbell className="w-12 h-12 text-white/10" />
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded border border-white/10 z-10">
                                    <span className="text-[10px] font-mono text-gym-red uppercase">
                                        {exercise.category || "STRENGTH"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-xl font-black uppercase mb-3 line-clamp-1" title={exercise.name}>
                                    {exercise.name}
                                </h3>

                                <p className="text-gray-400 text-xs font-sans line-clamp-3 mb-4">
                                    {exercise.instructions?.[0] || 'NO STRATEGIC DATA AVAILABLE.'}
                                </p>

                                <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2">
                                    {exercise.primaryMuscles.map((m: string) => (
                                        <span key={m} className="text-[10px] bg-gym-red/20 border border-gym-red/30 px-2 py-1 rounded text-gym-red uppercase font-mono">
                                            {m}
                                        </span>
                                    ))}
                                    {exercise.equipment && (
                                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300 uppercase font-mono">
                                            {exercise.equipment}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredExercises.length === 0 && (
                <div className="text-center py-20 text-gray-500 font-mono">
                    NO MATCHING INTEL FOUND.
                </div>
            )}

            {/* Pagination controls */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 hover:text-gym-red disabled:opacity-50 disabled:hover:text-gray-500 transition-colors uppercase font-bold text-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>

                <span className="font-mono text-gym-red">
                    PAGE {page} <span className="text-gray-500">of {maxPage}</span>
                </span>

                <button
                    onClick={() => setPage(p => Math.min(maxPage, p + 1))}
                    disabled={page >= maxPage}
                    className="flex items-center gap-2 px-4 py-2 hover:text-gym-red disabled:opacity-50 disabled:hover:text-gray-500 transition-colors uppercase font-bold text-sm"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
