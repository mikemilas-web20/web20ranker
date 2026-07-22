import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

function mask(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const key = getSetting("youtube_api_key") || process.env.YOUTUBE_API_KEY || "";
  return NextResponse.json({
    hasApiKey: Boolean(key),
    apiKeyMasked: key ? mask(key) : "",
    senderName: getSetting("sender_name") || "",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    setSetting("youtube_api_key", body.apiKey.trim());
  }
  if (typeof body.senderName === "string") {
    setSetting("sender_name", body.senderName.trim());
  }
  return NextResponse.json({ ok: true });
}
