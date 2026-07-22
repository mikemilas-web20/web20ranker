const API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function yt(
  apiKey: string | null,
  endpoint: string,
  params: Record<string, string>
) {
  if (!apiKey) {
    throw new YouTubeApiError(
      "No YouTube API key configured. Add one in Settings.",
      428
    );
  }
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) {
    const message =
      json?.error?.message || `YouTube API request failed (${res.status})`;
    throw new YouTubeApiError(message, res.status);
  }
  return json;
}

export interface ChannelResult {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  customUrl: string;
  country: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  matchedVideos?: { id: string; title: string }[];
}

export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount?: number;
}

interface RawChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    country?: string;
    publishedAt: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
  statistics?: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
  };
}

function mapChannel(c: RawChannel): ChannelResult {
  return {
    id: c.id,
    title: c.snippet.title,
    description: c.snippet.description,
    thumbnail:
      c.snippet.thumbnails?.medium?.url ||
      c.snippet.thumbnails?.default?.url ||
      "",
    customUrl: c.snippet.customUrl || "",
    country: c.snippet.country || "",
    subscriberCount: Number(c.statistics?.subscriberCount || 0),
    videoCount: Number(c.statistics?.videoCount || 0),
    viewCount: Number(c.statistics?.viewCount || 0),
    publishedAt: c.snippet.publishedAt,
  };
}

async function listChannels(
  apiKey: string,
  ids: string[]
): Promise<ChannelResult[]> {
  if (ids.length === 0) return [];
  const results: ChannelResult[] = [];
  // channels.list accepts up to 50 ids per call
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const json = await yt(apiKey, "channels", {
      part: "snippet,statistics",
      id: batch.join(","),
      maxResults: "50",
    });
    for (const c of json.items || []) results.push(mapChannel(c));
  }
  // Preserve original search ranking
  const order = new Map(ids.map((id, i) => [id, i]));
  results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return results;
}

export interface SearchOptions {
  regionCode?: string;
  publishedAfter?: string; // ISO date
  maxResults?: number; // 1-50
}

/** Direct channel search: good when the niche keyword appears in channel names/descriptions. */
export async function searchChannels(
  apiKey: string,
  q: string,
  opts: SearchOptions = {}
): Promise<ChannelResult[]> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "channel",
    q,
    maxResults: String(opts.maxResults ?? 25),
  };
  if (opts.regionCode) params.regionCode = opts.regionCode;
  const json = await yt(apiKey, "search", params);
  const ids = (json.items || [])
    .map((i: { snippet?: { channelId?: string } }) => i.snippet?.channelId)
    .filter(Boolean);
  return listChannels(apiKey, ids);
}

/**
 * Video-based discovery: search videos for the niche keyword and surface the
 * channels behind them. Finds active creators whose channel name doesn't
 * mention the niche.
 */
export async function discoverChannelsViaVideos(
  apiKey: string,
  q: string,
  opts: SearchOptions = {}
): Promise<ChannelResult[]> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    q,
    maxResults: "50",
    order: "relevance",
  };
  if (opts.regionCode) params.regionCode = opts.regionCode;
  if (opts.publishedAfter) params.publishedAfter = opts.publishedAfter;
  const json = await yt(apiKey, "search", params);

  const videosByChannel = new Map<string, { id: string; title: string }[]>();
  const ids: string[] = [];
  for (const item of json.items || []) {
    const channelId = item.snippet?.channelId;
    if (!channelId) continue;
    if (!videosByChannel.has(channelId)) {
      videosByChannel.set(channelId, []);
      ids.push(channelId);
    }
    videosByChannel.get(channelId)!.push({
      id: item.id?.videoId || "",
      title: item.snippet?.title || "",
    });
  }

  const channels = await listChannels(
    apiKey,
    ids.slice(0, opts.maxResults ?? 25)
  );
  for (const ch of channels) ch.matchedVideos = videosByChannel.get(ch.id);
  return channels;
}

export async function getChannel(
  apiKey: string,
  id: string
): Promise<ChannelResult | null> {
  const json = await yt(apiKey, "channels", {
    part: "snippet,statistics,contentDetails",
    id,
  });
  const item = json.items?.[0];
  if (!item) return null;
  return mapChannel(item);
}

/** Recent uploads via the channel's uploads playlist (much cheaper than search). */
export async function getRecentVideos(
  apiKey: string,
  channelId: string,
  max = 6
): Promise<VideoResult[]> {
  const chJson = await yt(apiKey, "channels", {
    part: "contentDetails",
    id: channelId,
  });
  const uploads =
    chJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];

  let plJson;
  try {
    plJson = await yt(apiKey, "playlistItems", {
      part: "snippet,contentDetails",
      playlistId: uploads,
      maxResults: String(max),
    });
  } catch (e) {
    // Channels with zero uploads return 404 for their uploads playlist
    if (e instanceof YouTubeApiError && e.status === 404) return [];
    throw e;
  }

  return (plJson.items || []).map(
    (i: {
      contentDetails?: { videoId?: string; videoPublishedAt?: string };
      snippet?: {
        title?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }) => ({
      id: i.contentDetails?.videoId || "",
      title: i.snippet?.title || "",
      thumbnail:
        i.snippet?.thumbnails?.medium?.url ||
        i.snippet?.thumbnails?.default?.url ||
        "",
      publishedAt: i.contentDetails?.videoPublishedAt || "",
    })
  );
}
