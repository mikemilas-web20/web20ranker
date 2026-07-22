import { NextRequest, NextResponse } from "next/server";
import { getDb, CHANNEL_STATUSES } from "@/lib/db";

const EDITABLE_FIELDS = ["status", "email", "notes", "niche"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const sets: string[] = [];
  const values: Record<string, string> = { id };
  for (const field of EDITABLE_FIELDS) {
    if (typeof body[field] === "string") {
      if (
        field === "status" &&
        !CHANNEL_STATUSES.includes(body.status as never)
      ) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      sets.push(`${field} = @${field}`);
      values[field] = body[field];
    }
  }
  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const result = getDb()
    .prepare(
      `UPDATE channels SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = @id`
    )
    .run(values);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Channel not saved" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb().prepare("DELETE FROM channels WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
