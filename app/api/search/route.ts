import { NextRequest, NextResponse } from "next/server";
import {
  searchChannels,
  discoverChannelsViaVideos,
  YouTubeApiError,
  ChannelResult,
} from "@/lib/youtube";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const mode = sp.get("mode") === "channels" ? "channels" : "videos";
  const regionCode = sp.get("region") || undefined;
  const maxResults = Math.min(Number(sp.get("max") || 25), 50);
  const publishedWithinDays = Number(sp.get("activeDays") || 0);
  const minSubs = Number(sp.get("minSubs") || 0);
  const maxSubs = Number(sp.get("maxSubs") || 0);

  const publishedAfter =
    publishedWithinDays > 0
      ? new Date(Date.now() - publishedWithinDays * 86400_000).toISOString()
      : undefined;

  try {
    let channels: ChannelResult[] =
      mode === "channels"
        ? await searchChannels(q, { regionCode, maxResults })
        : await discoverChannelsViaVideos(q, {
            regionCode,
            maxResults,
            publishedAfter,
          });

    if (minSubs > 0) channels = channels.filter((c) => c.subscriberCount >= minSubs);
    if (maxSubs > 0) channels = channels.filter((c) => c.subscriberCount <= maxSubs);

    const savedIds = new Set(
      (getDb().prepare("SELECT id FROM channels").all() as { id: string }[]).map(
        (r) => r.id
      )
    );

    return NextResponse.json({
      channels: channels.map((c) => ({ ...c, saved: savedIds.has(c.id) })),
    });
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
