import { NextRequest, NextResponse } from "next/server";
import { updateTemplate, deleteTemplate } from "@/lib/db";
import { requireApiSession } from "@/lib/apiauth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const { name, subject = "", body } = await req.json();
  if (!name || !body) {
    return NextResponse.json(
      { error: "name and body are required" },
      { status: 400 }
    );
  }
  const ok = await updateTemplate(
    guard.session.wid,
    Number(id),
    name,
    subject,
    body
  );
  if (!ok) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
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
  await deleteTemplate(guard.session.wid, Number(id));
  return NextResponse.json({ ok: true });
}
