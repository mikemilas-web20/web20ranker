import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { clearHistory } from "@/lib/searches";

export async function DELETE() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (active) await clearHistory(active.id);
  return NextResponse.json({ ok: true });
}
