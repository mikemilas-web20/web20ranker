import { NextRequest, NextResponse } from "next/server";
import {
  searchChannels,
  discoverChannelsViaVideos,
  YouTubeApiError,
  ChannelResult,
} from "@/lib/youtube";
import { listChannelIds } from "@/lib/db";
import { requireApiSession, resolveApiKey } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { logSearch } from "@/lib/searches";

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
  const publishedWithinDays = Number(sp.get("activeDays") || 0);
  const minSubs = Number(sp.get("minSubs") || 0);
  const maxSubs = Number(sp.get("maxSubs") || 0);

  // Depth → how many 50-result search pages to page through (~100 quota units each).
  const depth = sp.get("depth") || "standard";
  const maxPages = depth === "deepest" ? 5 : depth === "deep" ? 3 : 1;

  const publishedAfter =
    publishedWithinDays > 0
      ? new Date(Date.now() - publishedWithinDays * 86400_000).toISOString()
      : undefined;

  try {
    const apiKey = await resolveApiKey(wid);
    const searchOpts = {
      regionCode,
      maxPages,
      targetCount: 50,
      minSubs: minSubs || undefined,
      maxSubs: maxSubs || undefined,
    };
    const channels: ChannelResult[] =
      mode === "channels"
        ? await searchChannels(apiKey!, q, searchOpts)
        : await discoverChannelsViaVideos(apiKey!, q, {
            ...searchOpts,
            publishedAfter,
          });

    const active = await getActiveProject(wid);
    const savedIds = new Set(
      active ? await listChannelIds(active.id) : []
    );

    if (active) {
      await logSearch(active.id, {
        query: q,
        mode,
        filters: {
          region: regionCode,
          activeDays: publishedWithinDays ? String(publishedWithinDays) : "",
          minSubs: minSubs ? String(minSubs) : "",
          maxSubs: maxSubs ? String(maxSubs) : "",
          depth,
        },
        resultCount: channels.length,
      });
    }

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
