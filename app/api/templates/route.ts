import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const rows = getDb()
    .prepare("SELECT * FROM templates ORDER BY id")
    .all();
  return NextResponse.json({ templates: rows });
}

export async function POST(req: NextRequest) {
  const { name, subject = "", body } = await req.json();
  if (!name || !body) {
    return NextResponse.json(
      { error: "name and body are required" },
      { status: 400 }
    );
  }
  const result = getDb()
    .prepare("INSERT INTO templates (name, subject, body) VALUES (?, ?, ?)")
    .run(name, subject, body);
  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}
