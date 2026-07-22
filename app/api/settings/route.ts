import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { requireApiSession } from "@/lib/apiauth";

function mask(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid } = guard.session;

  const key =
    (await getSetting(wid, "youtube_api_key")) ||
    process.env.YOUTUBE_API_KEY ||
    "";
  return NextResponse.json({
    hasApiKey: Boolean(key),
    apiKeyMasked: key ? mask(key) : "",
    senderName: (await getSetting(wid, "sender_name")) || "",
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid } = guard.session;

  const body = await req.json();
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    await setSetting(wid, "youtube_api_key", body.apiKey.trim());
  }
  if (typeof body.senderName === "string") {
    await setSetting(wid, "sender_name", body.senderName.trim());
  }
  return NextResponse.json({ ok: true });
}
