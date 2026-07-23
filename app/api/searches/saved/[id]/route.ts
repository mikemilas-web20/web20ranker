import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { deleteSavedSearch } from "@/lib/searches";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (active) {
    const { id } = await params;
    await deleteSavedSearch(active.id, id);
  }
  return NextResponse.json({ ok: true });
}
