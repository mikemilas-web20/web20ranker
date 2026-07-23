"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/format";

interface Stats {
  total: number;
  withEmail: number;
  funnel: { status: string; count: number }[];
  engaged: number;
  responded: number;
  won: number;
  responseRate: number;
  winRate: number;
  niches: { niche: string; count: number }[];
  recentActivities: {
    id: string;
    yt_id: string;
    type: string;
    body: string;
    channel_title: string;
    created_at: string;
  }[];
  openTasks: { id: string; title: string; due_date: string; yt_id: string }[];
  overdueTasks: number;
}

// status tone -> fill color (semantic tokens, reserved for state)
const toneFill: Record<string, string> = {
  neutral: "bg-ink-dim",
  info: "bg-info",
  warn: "bg-warn",
  good: "bg-good",
  crit: "bg-crit",
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => {
        setStats(j.stats);
        setProjectName(j.project?.name ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>;
  if (!stats)
    return (
      <p className="text-ink-dim text-sm py-8 text-center">
        No active project.{" "}
        <Link href="/projects" className="text-accent underline">
          Create one
        </Link>
        .
      </p>
    );

  const funnelMax = Math.max(1, ...stats.funnel.map((f) => f.count));

  const tiles = [
    { label: "Creators", value: String(stats.total) },
    { label: "With email", value: String(stats.withEmail) },
    { label: "Response rate", value: pct(stats.responseRate), sub: `${stats.responded}/${stats.engaged} engaged` },
    { label: "Won", value: String(stats.won), sub: pct(stats.winRate) + " win rate" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="text-ink-dim text-sm mt-1">
            Project <span className="text-accent">{projectName}</span> at a glance.
          </p>
        </div>
        <ButtonLink
          href="/api/export/creators"
          external
          variant="default"
          size="sm"
          download=""
        >
          ↓ Export creators (CSV)
        </ButtonLink>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-line divide-x divide-y lg:divide-y-0 divide-line">
        {tiles.map((t) => (
          <div key={t.label} className="p-4">
            <div className="text-2xl font-bold tabular-nums text-ink">
              {t.value}
            </div>
            <div className="label !text-[9px] mt-1">{t.label}</div>
            {t.sub && (
              <div className="font-mono text-[10px] text-ink-dim mt-0.5">
                {t.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {stats.total === 0 ? (
        <div className="text-center text-ink-dim py-16 text-sm border border-dashed border-line">
          No creators in this project yet.{" "}
          <Link href="/" className="text-accent underline">
            Discover some →
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pipeline funnel */}
          <Card block className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
              Pipeline funnel
            </h2>
            <div className="flex flex-col gap-2.5">
              {stats.funnel.map((f) => {
                const tone = STATUS_TONE[f.status] ?? "neutral";
                return (
                  <div key={f.status} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-ink-dim text-right">
                      {STATUS_LABELS[f.status]}
                    </span>
                    <div className="flex-1 h-5 bg-surface-2 relative">
                      <div
                        className={`h-full ${toneFill[tone]} rounded-r-[3px]`}
                        style={{
                          width:
                            f.count === 0
                              ? "0%"
                              : `${Math.max(4, (f.count / funnelMax) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-ink text-right">
                      {f.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Niche breakdown */}
          <Card className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
              Top niches
            </h2>
            {stats.niches.length === 0 ? (
              <p className="text-sm text-ink-dim">
                No niche tags yet — add them on the creator pages.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats.niches.map((n) => {
                  const max = Math.max(1, ...stats.niches.map((x) => x.count));
                  return (
                    <div key={n.niche} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-ink-dim text-right truncate">
                        {n.niche}
                      </span>
                      <div className="flex-1 h-5 bg-surface-2">
                        <div
                          className="h-full bg-accent rounded-r-[3px]"
                          style={{
                            width: `${Math.max(4, (n.count / max) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-ink text-right">
                        {n.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent activity */}
          <Card className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
              Recent activity
            </h2>
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-ink-dim">No activity yet.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {stats.recentActivities.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span
                      className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${
                        toneFill[
                          a.type === "status"
                            ? "warn"
                            : a.type === "note"
                              ? "info"
                              : "neutral"
                        ]
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-ink">{a.body}</span>{" "}
                      {a.channel_title && (
                        <Link
                          href={`/channel/${a.yt_id}`}
                          className="text-ink-dim hover:text-accent"
                        >
                          — {a.channel_title}
                        </Link>
                      )}
                      <span className="font-mono text-[10px] text-ink-dim block">
                        {when(a.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Open tasks */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
                Open follow-ups
              </h2>
              <Link href="/tasks" className="text-xs text-accent underline">
                All tasks →
              </Link>
            </div>
            {stats.openTasks.length === 0 ? (
              <p className="text-sm text-ink-dim">Nothing outstanding.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.overdueTasks > 0 && (
                  <li className="text-xs text-crit font-mono">
                    {stats.overdueTasks} overdue
                  </li>
                )}
                {stats.openTasks.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-dim shrink-0" />
                    <span className="flex-1 text-ink truncate">{t.title}</span>
                    {t.due_date && (
                      <span className="font-mono text-[11px] text-ink-dim">
                        {t.due_date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
