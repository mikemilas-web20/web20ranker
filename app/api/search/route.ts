import { NextRequest, NextResponse } from "next/server";
import {
  searchChannels,
  discoverChannelsViaVideos,
  YouTubeApiError,
  ChannelResult,
} from "@/lib/youtube";
import { listChannelIds } from "@/lib/db";
import { requireApiSession, resolveApiKey } from "@/lib/apiauth";

export async function GET(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid } = guard.session;

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
    const apiKey = await resolveApiKey(wid);
    let channels: ChannelResult[] =
      mode === "channels"
        ? await searchChannels(apiKey!, q, { regionCode, maxResults })
        : await discoverChannelsViaVideos(apiKey!, q, {
            regionCode,
            maxResults,
            publishedAfter,
          });

    if (minSubs > 0)
      channels = channels.filter((c) => c.subscriberCount >= minSubs);
    if (maxSubs > 0)
      channels = channels.filter((c) => c.subscriberCount <= maxSubs);

    const savedIds = new Set(await listChannelIds(wid));

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
