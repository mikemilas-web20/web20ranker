"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCount, channelUrl, STATUS_LABELS } from "@/lib/format";
import { CHANNEL_STATUSES } from "@/lib/statuses";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { ButtonLink } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Badge";
import PipelineBoard from "@/components/PipelineBoard";

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
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [view, setView] = useState<"list" | "board">("list");

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((j) => {
        setChannels(j.channels);
        setProjectName(j.project?.name ?? null);
      })
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
    if (!confirm("Remove this channel from your pipeline?")) return;
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
          <h1 className="text-2xl font-bold tracking-tight text-ink">Pipeline</h1>
          <p className="text-ink-dim text-sm mt-1">
            {projectName ? (
              <>
                Project <span className="text-accent">{projectName}</span> —
                update status as outreach progresses.
              </>
            ) : (
              "Your creator pipeline — update status as outreach progresses."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-line-strong">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-accent text-accent-ink" : "text-ink-dim hover:text-ink"}`}
            >
              List
            </button>
            <button
              onClick={() => setView("board")}
              className={`px-3 py-1.5 text-sm border-l border-line-strong ${view === "board" ? "bg-accent text-accent-ink" : "text-ink-dim hover:text-ink"}`}
            >
              Board
            </button>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto"
          >
            <option value="">All statuses</option>
            {CHANNEL_STATUSES.map((k) => (
              <option key={k} value={k}>
                {STATUS_LABELS[k]} ({statusCounts[k] || 0})
              </option>
            ))}
          </Select>
          {niches.length > 0 && (
            <Select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="w-auto"
            >
              <option value="">All niches</option>
              {niches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* pipeline summary */}
      {channels.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 border border-line divide-x divide-line">
          {CHANNEL_STATUSES.map((k) => (
            <button
              key={k}
              onClick={() => setStatusFilter(statusFilter === k ? "" : k)}
              className={`p-3 text-left transition-colors ${
                statusFilter === k ? "bg-surface-2" : "hover:bg-surface-2/50"
              }`}
            >
              <div className="text-xl font-bold tabular-nums text-ink">
                {statusCounts[k] || 0}
              </div>
              <div className="label !text-[9px] mt-0.5">{STATUS_LABELS[k]}</div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>
      ) : channels.length === 0 ? (
        <div className="text-center text-ink-dim py-16 text-sm border border-dashed border-line">
          No saved channels yet.{" "}
          <Link href="/" className="text-accent underline">
            Discover some →
          </Link>
        </div>
      ) : view === "board" ? (
        <PipelineBoard
          channels={filtered}
          onMove={(id, status) => update(id, { status })}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center text-ink-dim py-16 text-sm border border-dashed border-line">
          No channels match the current filters.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-wrap gap-4 items-center">
              {c.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail}
                  alt=""
                  className="w-12 h-12 object-cover border border-line"
                />
              ) : (
                <div className="w-12 h-12 bg-surface-2 border border-line" />
              )}
              <div className="min-w-0 flex-1 basis-48">
                <Link
                  href={`/channel/${c.id}`}
                  className="font-semibold text-ink hover:text-accent block truncate"
                >
                  {c.title}
                </Link>
                <div className="font-mono text-[11px] text-ink-dim flex gap-2 mt-0.5">
                  <span className="text-ink">
                    {formatCount(c.subscriber_count)}
                  </span>
                  <span>subs</span>
                  {c.niche && (
                    <span className="text-ink-dim/70">· {c.niche}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill status={c.status} />
                <Select
                  value={c.status}
                  onChange={(e) => update(c.id, { status: e.target.value })}
                  aria-label="Change status"
                  className="w-auto !py-1.5 text-xs"
                >
                  {CHANNEL_STATUSES.map((k) => (
                    <option key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                defaultValue={c.email}
                placeholder="contact email"
                onBlur={(e) =>
                  e.target.value !== c.email &&
                  update(c.id, { email: e.target.value })
                }
                className="!w-56 !py-1.5 text-sm"
              />

              <div className="flex gap-1 ml-auto">
                <ButtonLink size="sm" variant="default" href={`/channel/${c.id}`}>
                  Outreach →
                </ButtonLink>
                <a
                  href={channelUrl(c.id, c.custom_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-ink-dim hover:text-ink border border-line"
                  title="Open on YouTube"
                >
                  ↗
                </a>
                <button
                  onClick={() => remove(c.id)}
                  className="px-3 py-1.5 text-ink-dim hover:text-crit border border-line hover:border-crit/40"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
