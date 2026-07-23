import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { listHistory, listSavedSearches } from "@/lib/searches";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) return NextResponse.json({ history: [], saved: [] });

  const [history, saved] = await Promise.all([
    listHistory(active.id),
    listSavedSearches(active.id),
  ]);
  return NextResponse.json({ history, saved });
}
