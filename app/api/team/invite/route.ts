import { NextRequest, NextResponse } from "next/server";
import { requireApiSession, requireOwner } from "@/lib/apiauth";
import { createInvite } from "@/lib/accounts";

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const ownerCheck = requireOwner(guard.session);
  if (ownerCheck) return ownerCheck;

  const { email } = await req.json().catch(() => ({}));
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }
  const token = await createInvite(
    guard.session.wid,
    guard.session.uid,
    String(email)
  );
  return NextResponse.json({ ok: true, token });
}
