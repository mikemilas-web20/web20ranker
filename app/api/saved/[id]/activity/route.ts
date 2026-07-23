import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { listActivities, logActivity } from "@/lib/activities";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) return NextResponse.json({ activities: [] });
  const { id } = await params;
  return NextResponse.json({ activities: await listActivities(active.id, id) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }
  const { id } = await params;
  const { body, type = "note" } = await req.json().catch(() => ({}));
  if (!body || !String(body).trim()) {
    return NextResponse.json({ error: "A note is required" }, { status: 400 });
  }
  await logActivity(
    active.id,
    id,
    String(type),
    String(body),
    guard.session.uid
  );
  return NextResponse.json({ ok: true });
}
