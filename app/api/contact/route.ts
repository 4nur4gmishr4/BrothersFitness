import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing identity fields" }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Process contact message (offline mode) - Remove in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`Contact received: ${name}, ${email}, ${message}`);
    }

    return NextResponse.json({ success: true, ref: "offline-mode" }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Transmission Error:", error);
    }
    return NextResponse.json({ error: "Comms Error" }, { status: 500 });
  }
}
