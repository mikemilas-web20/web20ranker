import { NextRequest, NextResponse } from "next/server";
import { requireApiSession, resolveApiKey } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { enrichCreator } from "@/lib/contacts";
import { YouTubeApiError } from "@/lib/youtube";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }
  const { id } = await params;
  try {
    const apiKey = await resolveApiKey(guard.session.wid);
    const result = await enrichCreator(active.id, id, apiKey!);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
