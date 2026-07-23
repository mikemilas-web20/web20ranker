import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { createSavedSearch } from "@/lib/searches";

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, query, mode = "videos", filters = {} } = body;
  if (!name || !String(name).trim() || !query || !String(query).trim()) {
    return NextResponse.json(
      { error: "A name and query are required" },
      { status: 400 }
    );
  }
  const id = await createSavedSearch(active.id, String(name), {
    query: String(query),
    mode: String(mode),
    filters: filters ?? {},
  });
  return NextResponse.json({ ok: true, id });
}
