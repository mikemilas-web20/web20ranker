import { NextRequest, NextResponse } from "next/server";
import { listTemplates, createTemplate } from "@/lib/db";
import { requireApiSession } from "@/lib/apiauth";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  return NextResponse.json({
    templates: await listTemplates(guard.session.wid),
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { name, subject = "", body } = await req.json();
  if (!name || !body) {
    return NextResponse.json(
      { error: "name and body are required" },
      { status: 400 }
    );
  }
  const id = await createTemplate(guard.session.wid, name, subject, body);
  return NextResponse.json({ ok: true, id });
}
