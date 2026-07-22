import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/accounts";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const session = await authenticate(String(email), String(password));
    if (!session) {
      return NextResponse.json(
        { error: "Incorrect email or password" },
        { status: 401 }
      );
    }
    await setSession(session);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[login] error:", e);
    const hint = !process.env.AUTH_SECRET
      ? "AUTH_SECRET is not set."
      : !process.env.DATABASE_HOST
        ? "Database environment variables are not set."
        : "The server could not reach the database.";
    return NextResponse.json(
      { error: `Server error while signing in. ${hint}` },
      { status: 500 }
    );
  }
}
