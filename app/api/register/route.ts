import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    // Validate input
    if (!name || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate phone format (basic)
    if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Process registration (offline mode) - Remove in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`Registration received: ${name}, ${phone}`);
    }

    return NextResponse.json(
      { message: "Transmission Successful", status: "lead_recorded" },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error:", error);
    }
    return NextResponse.json(
      { error: "Transmission Failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
