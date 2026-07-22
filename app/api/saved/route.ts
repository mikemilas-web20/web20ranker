import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const rows = getDb()
    .prepare("SELECT * FROM channels ORDER BY saved_at DESC")
    .all();
  return NextResponse.json({ channels: rows });
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
  getDb()
    .prepare(
      `INSERT INTO channels
        (id, title, description, thumbnail, custom_url, country,
         subscriber_count, video_count, view_count, niche)
       VALUES (@id, @title, @description, @thumbnail, @customUrl, @country,
         @subscriberCount, @videoCount, @viewCount, @niche)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         thumbnail = excluded.thumbnail,
         custom_url = excluded.custom_url,
         country = excluded.country,
         subscriber_count = excluded.subscriber_count,
         video_count = excluded.video_count,
         view_count = excluded.view_count,
         updated_at = datetime('now')`
    )
    .run({
      id,
      title,
      description: body.description ?? "",
      thumbnail: body.thumbnail ?? "",
      customUrl: body.customUrl ?? "",
      country: body.country ?? "",
      subscriberCount: body.subscriberCount ?? 0,
      videoCount: body.videoCount ?? 0,
      viewCount: body.viewCount ?? 0,
      niche: body.niche ?? "",
    });
  return NextResponse.json({ ok: true });
}
