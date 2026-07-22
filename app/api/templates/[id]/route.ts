import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, subject = "", body } = await req.json();
  if (!name || !body) {
    return NextResponse.json(
      { error: "name and body are required" },
      { status: 400 }
    );
  }
  const result = getDb()
    .prepare("UPDATE templates SET name = ?, subject = ?, body = ? WHERE id = ?")
    .run(name, subject, body, id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb().prepare("DELETE FROM templates WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
