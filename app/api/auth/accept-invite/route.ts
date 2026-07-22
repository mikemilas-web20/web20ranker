import { NextRequest, NextResponse } from "next/server";
import { acceptInvite } from "@/lib/accounts";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { token, name, password } = await req.json().catch(() => ({}));
  if (!token || !password) {
    return NextResponse.json(
      { error: "A password is required" },
      { status: 400 }
    );
  }
  if (String(password).length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  try {
    const session = await acceptInvite(
      String(token),
      String(name || ""),
      String(password)
    );
    await setSession(session);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not accept invite" },
      { status: 400 }
    );
  }
}
