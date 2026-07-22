import { NextRequest, NextResponse } from "next/server";
import {
  updateChannel,
  deleteChannel,
  CHANNEL_STATUSES,
  EditableChannelField,
} from "@/lib/db";
import { requireApiSession } from "@/lib/apiauth";

const EDITABLE_FIELDS: EditableChannelField[] = [
  "status",
  "email",
  "notes",
  "niche",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const body = await req.json();

  const patch: Partial<Record<EditableChannelField, string>> = {};
  for (const field of EDITABLE_FIELDS) {
    if (typeof body[field] === "string") {
      if (
        field === "status" &&
        !CHANNEL_STATUSES.includes(body.status as never)
      ) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      patch[field] = body[field];
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ok = await updateChannel(guard.session.wid, id, patch);
  if (!ok) {
    return NextResponse.json({ error: "Channel not saved" }, { status: 404 });
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
  await deleteChannel(guard.session.wid, id);
  return NextResponse.json({ ok: true });
}
