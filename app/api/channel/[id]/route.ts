import { NextRequest, NextResponse } from "next/server";
import { getChannel, getRecentVideos, YouTubeApiError } from "@/lib/youtube";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [channel, videos] = await Promise.all([
      getChannel(id),
      getRecentVideos(id),
    ]);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    const saved = getDb()
      .prepare("SELECT * FROM channels WHERE id = ?")
      .get(id);
    return NextResponse.json({ channel, videos, saved: saved ?? null });
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
