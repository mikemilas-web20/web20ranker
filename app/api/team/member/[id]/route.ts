import { NextRequest, NextResponse } from "next/server";
import { requireApiSession, requireOwner } from "@/lib/apiauth";
import { removeMember } from "@/lib/accounts";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const ownerCheck = requireOwner(guard.session);
  if (ownerCheck) return ownerCheck;

  const { id } = await params;
  const ok = await removeMember(guard.session.wid, id);
  if (!ok) {
    return NextResponse.json(
      { error: "The workspace owner can't be removed" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
