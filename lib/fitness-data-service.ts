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

let cachedFreeExercises: FreeExercise[] | null = null;

/**
 * Fetch all 800+ public domain exercises with full images from yuhonas/free-exercise-db
 */
export async function fetchFreeExerciseDb(): Promise<FreeExercise[]> {
    if (cachedFreeExercises) return cachedFreeExercises;

    try {
        const res = await fetch(FREE_EXERCISE_DB_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: FreeExercise[] = await res.json();

        cachedFreeExercises = data.map(ex => ({
            ...ex,
            images: ex.images.map(img => `${FREE_EXERCISE_IMAGE_BASE}${img}`)
        }));

        return cachedFreeExercises;
    } catch (err) {
        console.error("FreeExerciseDb fetch error:", err);
        return [];
    }
}

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
