import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { listContacts, addContact } from "@/lib/contacts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) return NextResponse.json({ contacts: [] });
  const { id } = await params;
  return NextResponse.json({ contacts: await listContacts(active.id, id) });
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
  const { type = "other", value } = await req.json().catch(() => ({}));
  if (!value || !String(value).trim()) {
    return NextResponse.json({ error: "A value is required" }, { status: 400 });
  }
  await addContact(active.id, id, String(type), String(value), "manual");
  return NextResponse.json({
    ok: true,
    contacts: await listContacts(active.id, id),
  });
}
