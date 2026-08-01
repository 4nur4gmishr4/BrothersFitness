import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const apiKey = process.env.API_NINJAS_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API Ninjas key missing" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const muscle = searchParams.get("muscle") || "biceps";

    try {
        const res = await fetch(`https://api.api-ninjas.com/v1/exercises?muscle=${encodeURIComponent(muscle)}`, {
            headers: { 'X-Api-Key': apiKey }
        });

        if (!res.ok) {
            return NextResponse.json({ error: `API Ninjas returned status ${res.status}` }, { status: res.status });
        }

        const exercises = await res.json();
        return NextResponse.json({ exercises });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
