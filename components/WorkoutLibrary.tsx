"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import Image from "next/image";

const API_KEY = process.env.NEXT_PUBLIC_WGER_API_KEY; // Must be set in .env.local
const BASE_URL = "https://wger.de/api/v2";

const fetcher = (url: string) => fetch(url, {
    headers: API_KEY ? { 'Authorization': `Token ${API_KEY}` } : {}
}).then(res => res.json());

// Helper to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

interface Exercise {
    id: number;
    name: string;
    description?: string;
    category?: { id: number; name: string };
    images?: { image: string }[];
    videos?: { video: string }[];
    muscles?: { id: number; name: string }[];
}

interface Category {
    id: number;
    name: string;
}

export default function WorkoutLibrary() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<number | null>(null);

    // Fetch exercises (using exerciseinfo for better details/images)
    // We use `exerciseinfo` endpoint which aggregates images and descriptions nicely
    const { data, error, isLoading } = useSWR(
        `${BASE_URL}/exerciseinfo/?limit=20&offset=${(page - 1) * 20}&language=2${category ? `&category=${category}` : ''}`, // language=2 is English
        fetcher
    );

    // Fetch Categories
    const { data: categories } = useSWR(`${BASE_URL}/exercisecategory/`, fetcher);

    // Initial Loading State - Skeleton Loading
    if (isLoading && !data) return (
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
            UPLINK FAILURE: UNABLE TO RETRIEVE TACTICAL DATA.
        </div>
    );

    const exercises = data?.results || [];
    const totalCount = data?.count || 0;
    const maxPage = Math.ceil(totalCount / 20);

    // Filter by search locally since API search can be restrictive/slow on free tier or tricky with 'exerciseinfo'
    const filteredExercises = search
        ? exercises.filter((ex: Exercise) => ex.name?.toLowerCase().includes(search.toLowerCase()))
        : exercises;

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-6 border border-white/10 rounded-xl">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="SEARCH DATABASE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black border border-white/20 pl-10 pr-4 py-3 text-white focus:border-gym-red focus:outline-none rounded-lg font-mono text-sm placeholder:text-gray-600"
                    />
                </div>

                {/* Filter */}
                <div className="relative md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                        className="w-full bg-black border border-white/20 pl-10 pr-8 py-3 text-white focus:border-gym-red focus:outline-none rounded-lg font-mono text-sm appearance-none cursor-pointer"
                        onChange={(e) => {
                            setCategory(e.target.value ? parseInt(e.target.value) : null);
                            setPage(1); // Reset to page 1 on filter
                        }}
                        value={category || ""}
                    >
                        <option value="">ALL DIVISIONS</option>
                        {categories?.results?.map((cat: Category) => (
                            <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredExercises.map((exercise: Exercise) => (
                        <motion.div
                            key={exercise.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className="bg-black border border-white/10 rounded-xl overflow-hidden hover:border-gym-red/50 transition-all group flex flex-col h-full"
                        >
                            {/* Media Section: Priority to Video, then Image */}
                            <div className="aspect-video bg-white/5 relative overflow-hidden">
                                {exercise.videos && exercise.videos.length > 0 ? (
                                    <video
                                        src={exercise.videos[0].video}
                                        controls
                                        className="w-full h-full object-cover"
                                        poster={exercise.images?.[0]?.image}
                                    />
                                ) : exercise.images && exercise.images.length > 0 ? (
                                    <Image
                                        src={exercise.images[0].image}
                                        alt={exercise.name || "Workout exercise demonstration"}
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
                                        {exercise.category?.name || "TACTICAL"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-xl font-black uppercase mb-3 line-clamp-1" title={exercise.name}>
                                    {exercise.name}
                                </h3>

                                <p
                                    className="text-gray-400 text-xs font-sans line-clamp-4 mb-4"
                                >
                                    {stripHtml(exercise.description || '') || 'NO STRATEGIC DATA AVAILABLE.'}
                                </p>

                                <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2">
                                    {exercise.muscles && exercise.muscles.length > 0 ? (
                                        exercise.muscles.map((m: { id: number; name: string }) => (
                                            <span key={m.id} className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300 uppercase">
                                                {m.name}
                                            </span>
                                        )).slice(0, 3)
                                    ) : (
                                        <span className="text-[10px] text-gray-600 uppercase">COMPOUND</span>
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
