import { NextRequest, NextResponse } from "next/server";
import { listChannels, upsertChannel } from "@/lib/db";
import { requireApiSession } from "@/lib/apiauth";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  return NextResponse.json({ channels: await listChannels(guard.session.wid) });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const body = await req.json();
  const { id, title } = body;
  if (!id || !title) {
    return NextResponse.json(
      { error: "id and title are required" },
      { status: 400 }
    );
  }
  await upsertChannel(guard.session.wid, {
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
