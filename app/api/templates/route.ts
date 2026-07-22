import { NextRequest, NextResponse } from "next/server";
import { listTemplates, createTemplate } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ templates: listTemplates() });
}

export async function POST(req: NextRequest) {
  const { name, subject = "", body } = await req.json();
  if (!name || !body) {
    return NextResponse.json(
      { error: "name and body are required" },
      { status: 400 }
    );
  }
  const id = createTemplate(name, subject, body);
  return NextResponse.json({ ok: true, id });
}
