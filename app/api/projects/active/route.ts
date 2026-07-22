import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getProject, setActiveProjectCookie } from "@/lib/projects";

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  // Validate the project belongs to the caller's workspace before switching.
  const project = await getProject(guard.session.wid, String(projectId));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  await setActiveProjectCookie(project.id);
  return NextResponse.json({ ok: true });
}
