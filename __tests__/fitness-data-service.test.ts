// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function okJson(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('fitness-data-service', () => {
    beforeEach(() => {
        // The module keeps an in-memory cache; reset it per test so each case
        // starts from a cold network state.
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchFreeExerciseDb', () => {
        it('maps image paths onto the CDN base and caches the result', async () => {
            const { fetchFreeExerciseDb } = await import('@/lib/fitness-data-service');
            const mockFetch = vi.fn().mockResolvedValue(
                okJson([{ id: 'e1', name: 'Squat', images: ['Squat/0.jpg'] }])
            );
            vi.stubGlobal('fetch', mockFetch);

            const first = await fetchFreeExerciseDb();
            const second = await fetchFreeExerciseDb();

            expect(first[0].images).toEqual([
                'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Squat/0.jpg',
            ]);
            // Second call is served from the module cache, not the network.
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(second).toEqual(first);
        });

        it('returns [] when the fetch fails', async () => {
            const { fetchFreeExerciseDb } = await import('@/lib/fitness-data-service');
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
            expect(await fetchFreeExerciseDb()).toEqual([]);
        });

        it('returns [] on a non-2xx response', async () => {
            const { fetchFreeExerciseDb } = await import('@/lib/fitness-data-service');
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));
            expect(await fetchFreeExerciseDb()).toEqual([]);
        });
    });

    describe('fetchApiNinjasExercises', () => {
        it('fetches all exercises when no muscle is given', async () => {
            const { fetchApiNinjasExercises } = await import('@/lib/fitness-data-service');
            const mockFetch = vi
                .fn()
                .mockResolvedValue(okJson({ exercises: [{ name: 'Bench Press' }] }));
            vi.stubGlobal('fetch', mockFetch);

            expect(await fetchApiNinjasExercises()).toEqual([{ name: 'Bench Press' }]);
            expect(mockFetch).toHaveBeenCalledWith('/api/exercises/ninjas');
        });

        it('encodes the target muscle into the query string', async () => {
            const { fetchApiNinjasExercises } = await import('@/lib/fitness-data-service');
            const mockFetch = vi.fn().mockResolvedValue(okJson({ exercises: [] }));
            vi.stubGlobal('fetch', mockFetch);

            await fetchApiNinjasExercises('chest press');
            expect(mockFetch).toHaveBeenCalledWith('/api/exercises/ninjas?muscle=chest%20press');
        });

        it('returns [] on error or non-ok response', async () => {
            const { fetchApiNinjasExercises } = await import('@/lib/fitness-data-service');
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
            expect(await fetchApiNinjasExercises()).toEqual([]);

            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
            expect(await fetchApiNinjasExercises()).toEqual([]);
        });
    });
});
