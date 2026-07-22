import { NextRequest, NextResponse } from "next/server";
import { listChannels, upsertChannel } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ channels: listChannels() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, title } = body;
  if (!id || !title) {
    return NextResponse.json(
      { error: "id and title are required" },
      { status: 400 }
    );
  }
  upsertChannel({
    id,
    title,
    description: body.description,
    thumbnail: body.thumbnail,
    customUrl: body.customUrl,
    country: body.country,
    subscriberCount: body.subscriberCount,
    videoCount: body.videoCount,
    viewCount: body.viewCount,
    niche: body.niche,
  });
  return NextResponse.json({ ok: true });
}
