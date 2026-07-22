import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/accounts";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
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
}
