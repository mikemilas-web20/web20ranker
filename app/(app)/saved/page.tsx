"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCount, channelUrl, STATUS_LABELS } from "@/lib/format";
import { CHANNEL_STATUSES } from "@/lib/statuses";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button, ButtonLink } from "@/components/ui/Button";
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
  contact_count?: number;
}

export default function SavedPage() {
  const [channels, setChannels] = useState<SavedChannel[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState<string | null>(null);

  function reload() {
    return fetch("/api/saved")
      .then((r) => r.json())
      .then((j) => {
        setChannels(j.channels);
        setProjectName(j.project?.name ?? null);
      });
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelected((prev) => {
      const allSelected = filtered.every((c) => prev.has(c.id));
      if (allSelected) return new Set();
      return new Set(filtered.map((c) => c.id));
    });
  }
  const selectedIds = filtered.filter((c) => selected.has(c.id)).map((c) => c.id);

  async function batchStatus(status: string) {
    if (selectedIds.length === 0 || !status) return;
    setBatchBusy("status");
    await fetch("/api/saved/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", ids: selectedIds, status }),
    });
    await reload();
    setSelected(new Set());
    setBatchBusy(null);
  }

  async function batchEnrich() {
    if (selectedIds.length === 0) return;
    setBatchBusy("enrich");
    const res = await fetch("/api/saved/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enrich", ids: selectedIds }),
    });
    const j = await res.json().catch(() => null);
    await reload();
    setBatchBusy(null);
    if (j?.added != null)
      alert(`Gathered ${j.added} new contact${j.added === 1 ? "" : "s"} across ${selectedIds.length} creators.`);
    else if (j?.error) alert(j.error);
  }

  function exportSelected() {
    const rows = filtered.filter((c) => selected.has(c.id));
    const header = ["title", "youtube_id", "subscribers", "niche", "status", "email"];
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      header.join(","),
      ...rows.map((c) =>
        [c.title, c.id, c.subscriber_count, c.niche, c.status, c.email]
          .map(esc)
          .join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "creators-selected.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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

      {/* batch toolbar (list view) */}
      {view === "list" && filtered.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap border border-line bg-surface px-3 py-2">
          <label className="flex items-center gap-2 text-sm text-ink-dim cursor-pointer">
            <input
              type="checkbox"
              checked={filtered.length > 0 && filtered.every((c) => selected.has(c.id))}
              onChange={selectAllFiltered}
              className="accent-accent"
            />
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
          </label>
          {selectedIds.length > 0 && (
            <>
              <span className="text-line-strong">|</span>
              <Button
                size="sm"
                variant="default"
                onClick={batchEnrich}
                disabled={batchBusy !== null}
              >
                {batchBusy === "enrich" ? "Gathering…" : "⤓ Gather contacts"}
              </Button>
              <Select
                value=""
                onChange={(e) => batchStatus(e.target.value)}
                disabled={batchBusy !== null}
                className="w-auto !py-1.5 text-sm"
              >
                <option value="">Set status…</option>
                {CHANNEL_STATUSES.map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABELS[k]}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="default" onClick={exportSelected}>
                ↓ Export selected
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-ink-dim hover:text-ink ml-auto"
              >
                Clear
              </button>
            </>
          )}
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
            <Card
              key={c.id}
              className={`flex flex-wrap gap-4 items-center ${selected.has(c.id) ? "border-accent/50" : ""}`}
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleSelect(c.id)}
                className="accent-accent shrink-0"
                aria-label={`Select ${c.title}`}
              />
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
                  {(c.contact_count ?? 0) > 0 && (
                    <span className="text-good">· ✉ {c.contact_count}</span>
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
