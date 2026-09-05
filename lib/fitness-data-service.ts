import { unstable_cache } from 'next/cache';

// Unified Fitness & Nutrition Data Service

export interface FreeExercise {
    id: string;
    name: string;
    force?: string | null;
    level?: string | null;
    mechanic?: string | null;
    equipment?: string | null;
    primaryMuscles: string[];
    secondaryMuscles?: string[];
    instructions: string[];
    category: string;
    images: string[];
}

export interface ApiNinjasExercise {
    name: string;
    type: string;
    muscle: string;
    equipment: string;
    difficulty: string;
    instructions: string;
}

const FREE_EXERCISE_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const FREE_EXERCISE_IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

/**
 * Fetch all 800+ public domain exercises with full images from yuhonas/free-exercise-db
 */
export const fetchFreeExerciseDb = unstable_cache(
    async (): Promise<FreeExercise[]> => {
        const res = await fetch(FREE_EXERCISE_DB_URL);
        if (!res.ok) throw new Error(`Failed to fetch FreeExerciseDb: HTTP ${res.status}`);
        const data: FreeExercise[] = await res.json();

        return data.map(ex => ({
            ...ex,
            images: ex.images.map(img => `${FREE_EXERCISE_IMAGE_BASE}${img}`)
        }));
    },
    ['free-exercise-db-cache'],
    { revalidate: 86400 } // Cache for 24 hours
);

/**
 * Fetch exercises from API Ninjas by target muscle group
 */
export async function fetchApiNinjasExercises(muscle?: string): Promise<ApiNinjasExercise[]> {
    try {
        const url = `/api/exercises/ninjas${muscle ? `?muscle=${encodeURIComponent(muscle)}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return data.exercises || [];
    } catch (err) {
        console.error("ApiNinjas fetch error:", err);
        return [];
    }
}
