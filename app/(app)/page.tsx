"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ChannelCard, { SearchChannel } from "@/components/ChannelCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Input";

const REGIONS = [
  ["", "Any region"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["ES", "Spain"],
  ["BR", "Brazil"],
  ["IN", "India"],
  ["JP", "Japan"],
];

interface Filters {
  region?: string;
  activeDays?: string;
  minSubs?: string;
  maxSubs?: string;
  depth?: string;
}
interface HistoryEntry {
  id: string;
  query: string;
  mode: string;
  filters: Filters;
  result_count: number;
}
interface SavedSearch extends HistoryEntry {
  name: string;
}
interface SearchParams {
  q: string;
  mode: "videos" | "channels";
  minSubs: string;
  maxSubs: string;
  region: string;
  activeDays: string;
  depth: string;
}

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"videos" | "channels">("videos");
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [region, setRegion] = useState("");
  const [activeDays, setActiveDays] = useState("90");
  const [depth, setDepth] = useState("standard");
  const [results, setResults] = useState<SearchChannel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  const loadSearches = useCallback(() => {
    fetch("/api/searches")
      .then((r) => r.json())
      .then((j) => {
        setHistory(j.history ?? []);
        setSaved(j.saved ?? []);
      })
      .catch(() => {});
  }, []);
  useEffect(loadSearches, [loadSearches]);

  const runSearch = useCallback(
    async (p: SearchParams) => {
      if (!p.q.trim()) return;
      setLoading(true);
      setError(null);
      setNeedsKey(false);
      try {
        const params = new URLSearchParams({ q: p.q.trim(), mode: p.mode });
        if (p.minSubs) params.set("minSubs", p.minSubs);
        if (p.maxSubs) params.set("maxSubs", p.maxSubs);
        if (p.region) params.set("region", p.region);
        if (p.mode === "videos" && p.activeDays)
          params.set("activeDays", p.activeDays);
        if (p.depth && p.depth !== "standard") params.set("depth", p.depth);
        const res = await fetch(`/api/search?${params}`);
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          if (res.status === 428) setNeedsKey(true);
          throw new Error(json?.error || `Search failed (${res.status})`);
        }
        setResults(json.channels);
        loadSearches(); // history was just logged server-side
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [loadSearches]
  );

  function currentParams(): SearchParams {
    return { q, mode, minSubs, maxSubs, region, activeDays, depth };
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    runSearch(currentParams());
  }

  function applyEntry(entry: HistoryEntry) {
    const f = entry.filters ?? {};
    const next: SearchParams = {
      q: entry.query,
      mode: entry.mode === "channels" ? "channels" : "videos",
      minSubs: f.minSubs ?? "",
      maxSubs: f.maxSubs ?? "",
      region: f.region ?? "",
      activeDays: f.activeDays ?? "",
      depth: f.depth ?? "standard",
    };
    setQ(next.q);
    setMode(next.mode);
    setMinSubs(next.minSubs);
    setMaxSubs(next.maxSubs);
    setRegion(next.region);
    setActiveDays(next.activeDays);
    setDepth(next.depth);
    runSearch(next);
  }

  async function saveCurrentSearch() {
    if (!q.trim()) return;
    const name = window.prompt("Name this search:", q.trim());
    if (!name || !name.trim()) return;
    await fetch("/api/searches/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        query: q.trim(),
        mode,
        filters: { region, activeDays, minSubs, maxSubs, depth },
      }),
    });
    loadSearches();
  }

  async function deleteSaved(id: string) {
    await fetch(`/api/searches/saved/${id}`, { method: "DELETE" });
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  async function clearHistory() {
    await fetch("/api/searches/history", { method: "DELETE" });
    setHistory([]);
  }

  async function save(channel: SearchChannel) {
    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...channel, niche: q.trim() }),
    });
    if (res.ok) {
      setResults(
        (prev) =>
          prev?.map((c) => (c.id === channel.id ? { ...c, saved: true } : c)) ??
          null
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Discover channels
        </h1>
        <p className="text-ink-dim text-sm mt-1">
          Search a niche or topic to find YouTube creators worth reaching out to.
        </p>
      </div>

      <Card block className="flex flex-col gap-4">
        <form onSubmit={submit} className="contents">
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Niche or topic — "keto recipes", "budget travel", "woodworking"'
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !q.trim()}
              className="shrink-0"
            >
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <Field label="Mode" className="min-w-52">
              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value as "videos" | "channels")}
              >
                <option value="videos">Via videos (best for niches)</option>
                <option value="channels">Channel name / description</option>
              </Select>
            </Field>
            <Field label="Min subs" className="w-28">
              <Input
                value={minSubs}
                onChange={(e) => setMinSubs(e.target.value.replace(/\D/g, ""))}
                placeholder="1000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Max subs" className="w-28">
              <Input
                value={maxSubs}
                onChange={(e) => setMaxSubs(e.target.value.replace(/\D/g, ""))}
                placeholder="500000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Region" className="min-w-40">
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {mode === "videos" && (
              <Field label="Posted within" className="min-w-36">
                <Select
                  value={activeDays}
                  onChange={(e) => setActiveDays(e.target.value)}
                >
                  <option value="">Any time</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </Select>
              </Field>
            )}
            <Field
              label="Depth"
              className="min-w-40"
              hint="More depth = more results, more quota"
            >
              <Select value={depth} onChange={(e) => setDepth(e.target.value)}>
                <option value="standard">Standard (~100 units)</option>
                <option value="deep">Deep (~300 units)</option>
                <option value="deepest">Deepest (~500 units)</option>
              </Select>
            </Field>
          </div>
        </form>
      </Card>

      {/* Saved searches + recent history */}
      {(saved.length > 0 || history.length > 0) && (
        <div className="flex flex-col gap-3">
          {saved.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="label pt-1.5 shrink-0">Saved</span>
              <div className="flex gap-1.5 flex-wrap">
                {saved.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center border border-line-strong bg-surface-2"
                  >
                    <button
                      onClick={() => applyEntry(s)}
                      className="px-2.5 py-1 text-sm text-ink hover:text-accent"
                      title={`${s.query} · ${s.mode}`}
                    >
                      ★ {s.name}
                    </button>
                    <button
                      onClick={() => deleteSaved(s.id)}
                      className="px-1.5 py-1 text-ink-dim hover:text-crit border-l border-line"
                      title="Delete saved search"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="label pt-1.5 shrink-0">Recent</span>
              <div className="flex gap-1.5 flex-wrap items-center">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => applyEntry(h)}
                    className="px-2.5 py-1 text-sm border border-line bg-surface-2 text-ink-dim hover:text-ink hover:border-line-strong"
                    title={`${h.result_count} results · ${h.mode}`}
                  >
                    {h.query}
                  </button>
                ))}
                <button
                  onClick={clearHistory}
                  className="px-2 py-1 text-xs text-ink-dim hover:text-crit"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {needsKey && (
        <div className="border border-warn/50 bg-warn/10 text-ink px-4 py-3 text-sm">
          You need a YouTube Data API key to search.{" "}
          <Link href="/settings" className="text-accent font-medium underline">
            Add one in Settings →
          </Link>
        </div>
      )}
      {error && !needsKey && (
        <div className="border border-crit/50 bg-crit/10 text-ink px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {results && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="label">
              {results.length} channel{results.length === 1 ? "" : "s"} found
              {results.length === 0 &&
                " — try widening the subscriber range or a broader keyword"}
            </p>
            {q.trim() && (
              <Button size="sm" variant="ghost" onClick={saveCurrentSearch}>
                ★ Save this search
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((c) => (
              <ChannelCard key={c.id} channel={c} onSave={save} />
            ))}
          </div>
        </>
      )}

      {!results && !error && !needsKey && (
        <div className="text-center text-ink-dim py-16 text-sm border border-dashed border-line">
          Search results will appear here. Saved channels go to your{" "}
          <Link href="/saved" className="text-accent underline">
            Pipeline
          </Link>
          .
        </div>
      )}
    </div>
  );
}
