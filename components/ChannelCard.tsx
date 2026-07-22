"use client";

import Link from "next/link";
import { formatCount, channelUrl } from "@/lib/format";

export interface SearchChannel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  customUrl: string;
  country: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  saved?: boolean;
  matchedVideos?: { id: string; title: string }[];
}

export default function ChannelCard({
  channel,
  onSave,
}: {
  channel: SearchChannel;
  onSave: (c: SearchChannel) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {channel.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.thumbnail}
            alt=""
            className="w-14 h-14 rounded-full shrink-0 object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full shrink-0 bg-slate-800" />
        )}
        <div className="min-w-0">
          <Link
            href={`/channel/${channel.id}`}
            className="font-medium text-white hover:underline block truncate"
          >
            {channel.title}
          </Link>
          <div className="text-xs text-slate-400 flex gap-2 flex-wrap mt-0.5">
            <span>{formatCount(channel.subscriberCount)} subs</span>
            <span>{formatCount(channel.videoCount)} videos</span>
            <span>{formatCount(channel.viewCount)} views</span>
            {channel.country && <span>{channel.country}</span>}
          </div>
        </div>
      </div>

      {channel.description && (
        <p className="text-sm text-slate-400 line-clamp-2">
          {channel.description}
        </p>
      )}

      {channel.matchedVideos && channel.matchedVideos.length > 0 && (
        <p className="text-xs text-slate-500 line-clamp-1">
          Matched video: “{channel.matchedVideos[0].title}”
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 text-sm">
        <button
          onClick={() => onSave(channel)}
          disabled={channel.saved}
          className={`px-3 py-1.5 rounded-md font-medium ${
            channel.saved
              ? "bg-emerald-900/50 text-emerald-300 cursor-default"
              : "bg-red-600 hover:bg-red-500 text-white"
          }`}
        >
          {channel.saved ? "✓ Saved" : "Save for outreach"}
        </button>
        <a
          href={channelUrl(channel.id, channel.customUrl)}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-md text-slate-300 hover:bg-slate-800"
        >
          View on YouTube ↗
        </a>
      </div>
    </div>
  );
}
