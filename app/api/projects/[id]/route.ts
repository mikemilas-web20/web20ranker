import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { updateProject, deleteProject } from "@/lib/projects";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ok = await updateProject(guard.session.wid, id, {
    name: body.name,
    description: body.description,
    status: body.status,
  });
  if (!ok) {
    return NextResponse.json(
      { error: "Project not found or nothing to update" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const result = await deleteProject(guard.session.wid, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
