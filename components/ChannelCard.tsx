"use client";

import Link from "next/link";
import { formatCount, channelUrl } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

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
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {channel.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.thumbnail}
            alt=""
            className="w-14 h-14 shrink-0 object-cover border border-line"
          />
        ) : (
          <div className="w-14 h-14 shrink-0 bg-surface-2 border border-line" />
        )}
        <div className="min-w-0">
          <Link
            href={`/channel/${channel.id}`}
            className="font-semibold text-ink hover:text-accent block truncate"
          >
            {channel.title}
          </Link>
          <div className="font-mono text-[11px] text-ink-dim flex gap-2 flex-wrap mt-1">
            <span className="text-ink">{formatCount(channel.subscriberCount)}</span>
            <span>subs</span>
            <span className="text-line-strong">·</span>
            <span>{formatCount(channel.videoCount)} vids</span>
            {channel.country && (
              <>
                <span className="text-line-strong">·</span>
                <span>{channel.country}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {channel.description && (
        <p className="text-sm text-ink-dim line-clamp-2">{channel.description}</p>
      )}

      {channel.matchedVideos && channel.matchedVideos.length > 0 && (
        <p className="font-mono text-[11px] text-ink-dim/80 line-clamp-1 border-l-2 border-accent/50 pl-2">
          matched: {channel.matchedVideos[0].title}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant={channel.saved ? "default" : "primary"}
          onClick={() => onSave(channel)}
          disabled={channel.saved}
          className={channel.saved ? "!text-good !border-good/40" : ""}
        >
          {channel.saved ? "✓ Saved" : "Save for outreach"}
        </Button>
        <ButtonLink
          size="sm"
          variant="ghost"
          href={channelUrl(channel.id, channel.customUrl)}
          external
          target="_blank"
          rel="noreferrer"
        >
          YouTube ↗
        </ButtonLink>
      </div>
    </Card>
  );
}
