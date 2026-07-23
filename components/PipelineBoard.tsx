"use client";

import { useState } from "react";
import Link from "next/link";
import { CHANNEL_STATUSES } from "@/lib/statuses";
import { STATUS_LABELS, STATUS_TONE, formatCount } from "@/lib/format";

export interface BoardChannel {
  id: string;
  title: string;
  subscriber_count: number;
  niche: string;
  status: string;
  email: string;
}

const columnAccent: Record<string, string> = {
  neutral: "border-t-line-strong",
  info: "border-t-info",
  warn: "border-t-warn",
  good: "border-t-good",
  crit: "border-t-crit",
};

export default function PipelineBoard({
  channels,
  onMove,
}: {
  channels: BoardChannel[];
  onMove: (id: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  function drop(status: string) {
    if (dragId) {
      const ch = channels.find((c) => c.id === dragId);
      if (ch && ch.status !== status) onMove(dragId, status);
    }
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {CHANNEL_STATUSES.map((status) => {
          const items = channels.filter((c) => c.status === status);
          const tone = STATUS_TONE[status] ?? "neutral";
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(status);
              }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={() => drop(status)}
              className={`w-64 shrink-0 bg-surface border border-line border-t-2 ${columnAccent[tone]} flex flex-col ${
                overCol === status ? "ring-1 ring-accent" : ""
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-line">
                <span className="label !text-[10px]">{STATUS_LABELS[status]}</span>
                <span className="font-mono text-[11px] text-ink-dim tabular-nums">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 min-h-24">
                {items.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    className={`bg-surface-2 border border-line p-2.5 cursor-grab active:cursor-grabbing ${
                      dragId === c.id ? "opacity-40" : ""
                    }`}
                  >
                    <Link
                      href={`/channel/${c.id}`}
                      className="text-sm text-ink hover:text-accent font-medium block truncate"
                    >
                      {c.title}
                    </Link>
                    <div className="font-mono text-[10px] text-ink-dim mt-1 flex gap-1.5 flex-wrap">
                      <span>{formatCount(c.subscriber_count)} subs</span>
                      {c.niche && <span>· {c.niche}</span>}
                    </div>
                    {c.email && (
                      <div className="font-mono text-[10px] text-good mt-0.5 truncate">
                        ✉ {c.email}
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center text-ink-dim/50 text-xs py-4 border border-dashed border-line">
                    drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
