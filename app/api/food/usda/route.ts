import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "Chicken";

    try {
        const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=DEMO_KEY`);
        
        if (!res.ok) {
            return NextResponse.json({ error: `USDA API returned status ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ foods: data.foods || [] });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
