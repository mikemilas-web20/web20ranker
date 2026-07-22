"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatCount,
  channelUrl,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/format";

interface SavedChannel {
  id: string;
  title: string;
  thumbnail: string;
  custom_url: string;
  subscriber_count: number;
  video_count: number;
  niche: string;
  status: string;
  email: string;
  notes: string;
  saved_at: string;
}

export default function SavedPage() {
  const [channels, setChannels] = useState<SavedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((j) => setChannels(j.channels))
      .finally(() => setLoading(false));
  }, []);

  async function update(id: string, patch: Partial<SavedChannel>) {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    await fetch(`/api/saved/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function remove(id: string) {
    if (!confirm("Remove this channel from your saved list?")) return;
    setChannels((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/saved/${id}`, { method: "DELETE" });
  }

  const niches = [...new Set(channels.map((c) => c.niche).filter(Boolean))];
  const filtered = channels.filter(
    (c) =>
      (!statusFilter || c.status === statusFilter) &&
      (!nicheFilter || c.niche === nicheFilter)
  );

  const statusCounts = channels.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Saved &amp; Outreach
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Your creator pipeline — update status as outreach progresses.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v} ({statusCounts[k] || 0})
              </option>
            ))}
          </select>
          {niches.length > 0 && (
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5"
            >
              <option value="">All niches</option>
              {niches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm py-8 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-16 text-sm">
          {channels.length === 0 ? (
            <>
              No saved channels yet.{" "}
              <Link href="/" className="underline">
                Discover some →
              </Link>
            </>
          ) : (
            "No channels match the current filters."
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-wrap gap-4 items-center"
            >
              {c.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800" />
              )}
              <div className="min-w-0 flex-1 basis-48">
                <Link
                  href={`/channel/${c.id}`}
                  className="font-medium text-white hover:underline block truncate"
                >
                  {c.title}
                </Link>
                <div className="text-xs text-slate-400 flex gap-2 mt-0.5">
                  <span>{formatCount(c.subscriber_count)} subs</span>
                  {c.niche && (
                    <span className="text-slate-500">· {c.niche}</span>
                  )}
                </div>
              </div>

              <select
                value={c.status}
                onChange={(e) => update(c.id, { status: e.target.value })}
                className={`rounded-md px-2 py-1.5 text-sm border border-transparent ${STATUS_COLORS[c.status] || ""}`}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">
                    {v}
                  </option>
                ))}
              </select>

              <input
                defaultValue={c.email}
                placeholder="contact email"
                onBlur={(e) =>
                  e.target.value !== c.email &&
                  update(c.id, { email: e.target.value })
                }
                className="w-48 rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm placeholder:text-slate-600"
              />

              <div className="flex gap-1 text-sm">
                <Link
                  href={`/channel/${c.id}`}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Outreach →
                </Link>
                <a
                  href={channelUrl(c.id, c.custom_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md text-slate-400 hover:bg-slate-800"
                  title="Open on YouTube"
                >
                  ↗
                </a>
                <button
                  onClick={() => remove(c.id)}
                  className="px-3 py-1.5 rounded-md text-slate-500 hover:text-rose-300 hover:bg-rose-950/40"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
