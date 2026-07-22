import { NextRequest, NextResponse } from "next/server";
import { getChannel, getRecentVideos, YouTubeApiError } from "@/lib/youtube";
import { getChannelRow } from "@/lib/db";
import { requireApiSession, resolveApiKey } from "@/lib/apiauth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid } = guard.session;

  const { id } = await params;
  try {
    const apiKey = await resolveApiKey(wid);
    const [channel, videos] = await Promise.all([
      getChannel(apiKey!, id),
      getRecentVideos(apiKey!, id),
    ]);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    const saved = await getChannelRow(wid, id);
    return NextResponse.json({ channel, videos, saved });
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
