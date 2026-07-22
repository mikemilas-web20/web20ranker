import { NextRequest, NextResponse } from "next/server";
import { requireApiSession, requireOwner } from "@/lib/apiauth";
import { revokeInvite } from "@/lib/accounts";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const ownerCheck = requireOwner(guard.session);
  if (ownerCheck) return ownerCheck;

  const { id } = await params;
  await revokeInvite(guard.session.wid, id);
  return NextResponse.json({ ok: true });
}
