"use client";

import { useState } from "react";
import Link from "next/link";
import ChannelCard, { SearchChannel } from "@/components/ChannelCard";

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

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"videos" | "channels">("videos");
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [region, setRegion] = useState("");
  const [activeDays, setActiveDays] = useState("90");
  const [results, setResults] = useState<SearchChannel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setNeedsKey(false);
    try {
      const params = new URLSearchParams({ q: q.trim(), mode });
      if (minSubs) params.set("minSubs", minSubs);
      if (maxSubs) params.set("maxSubs", maxSubs);
      if (region) params.set("region", region);
      if (mode === "videos" && activeDays) params.set("activeDays", activeDays);
      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 428) setNeedsKey(true);
        throw new Error(json.error || "Search failed");
      }
      setResults(json.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-semibold text-white">Discover channels</h1>
        <p className="text-slate-400 text-sm mt-1">
          Search a niche or topic to find YouTube creators worth reaching out to.
        </p>
      </div>

      <form
        onSubmit={search}
        className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-4"
      >
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Niche or topic, e.g. "keto recipes", "budget travel", "woodworking"'
            className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm items-end">
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Discovery mode</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "videos" | "channels")}
              className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
            >
              <option value="videos">Via videos (best for niches)</option>
              <option value="channels">Channel name/description</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Min subs</span>
            <input
              value={minSubs}
              onChange={(e) => setMinSubs(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 1000"
              className="w-28 rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Max subs</span>
            <input
              value={maxSubs}
              onChange={(e) => setMaxSubs(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 500000"
              className="w-28 rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Region</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
            >
              {REGIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {mode === "videos" && (
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Posted within</span>
              <select
                value={activeDays}
                onChange={(e) => setActiveDays(e.target.value)}
                className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
              >
                <option value="">Any time</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
              </select>
            </label>
          )}
        </div>
      </form>

      {needsKey && (
        <div className="rounded-lg border border-amber-700 bg-amber-950/40 text-amber-200 px-4 py-3 text-sm">
          You need a YouTube Data API key to search.{" "}
          <Link href="/settings" className="underline font-medium">
            Add one in Settings →
          </Link>
        </div>
      )}
      {error && !needsKey && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 text-rose-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {results && (
        <>
          <p className="text-sm text-slate-400">
            {results.length} channel{results.length === 1 ? "" : "s"} found
            {results.length === 0 &&
              " — try widening the subscriber range or a broader keyword"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((c) => (
              <ChannelCard key={c.id} channel={c} onSave={save} />
            ))}
          </div>
        </>
      )}

      {!results && !error && !needsKey && (
        <div className="text-center text-slate-500 py-16 text-sm">
          Search results will appear here. Saved channels go to{" "}
          <Link href="/saved" className="underline">
            Saved &amp; Outreach
          </Link>
          .
        </div>
      )}
    </div>
  );
}
