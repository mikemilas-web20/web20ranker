"use client";

import { useState } from "react";
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
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Discover channels
        </h1>
        <p className="text-ink-dim text-sm mt-1">
          Search a niche or topic to find YouTube creators worth reaching out to.
        </p>
      </div>

      <Card block className="flex flex-col gap-4">
        <form onSubmit={search} className="contents">
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
          </div>
        </form>
      </Card>

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
          <p className="label">
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
