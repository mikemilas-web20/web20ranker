import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { listProjects, createProject, getActiveProject } from "@/lib/projects";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid } = guard.session;
  const [projects, active] = await Promise.all([
    listProjects(wid),
    getActiveProject(wid),
  ]);
  return NextResponse.json({ projects, activeId: active?.id ?? null });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { name, description = "" } = await req.json().catch(() => ({}));
  if (!name || !String(name).trim()) {
    return NextResponse.json(
      { error: "A project name is required" },
      { status: 400 }
    );
  }
  const id = await createProject(
    guard.session.wid,
    String(name),
    String(description)
  );
  return NextResponse.json({ ok: true, id });
}
