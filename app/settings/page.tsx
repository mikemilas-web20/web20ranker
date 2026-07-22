"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [senderName, setSenderName] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        setHasApiKey(j.hasApiKey);
        setApiKeyMasked(j.apiKeyMasked);
        setSenderName(j.senderName);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, senderName }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (apiKey) {
      setHasApiKey(true);
      setApiKey("");
    }
    const j = await fetch("/api/settings").then((r) => r.json());
    setApiKeyMasked(j.apiKeyMasked);
  }

  if (loading)
    return <p className="text-slate-500 text-sm py-8 text-center">Loading…</p>;

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure your YouTube API access and outreach identity.
        </p>
      </div>

      <form
        onSubmit={save}
        className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white">
            YouTube Data API v3 key
          </label>
          {hasApiKey && (
            <p className="text-xs text-emerald-400">
              ✓ A key is configured ({apiKeyMasked}). Enter a new one to replace
              it.
            </p>
          )}
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
            placeholder={hasApiKey ? "Enter new key to replace" : "AIza…"}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2"
          />
          <p className="text-xs text-slate-500">
            Get one free from the{" "}
            <a
              href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Google Cloud Console
            </a>{" "}
            — enable “YouTube Data API v3” and create an API key. The default
            free quota is 10,000 units/day.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white">Your name</label>
          <input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Used to fill {{my_name}} in templates"
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium text-sm w-fit"
          >
            Save settings
          </button>
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        </div>
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
        <h2 className="font-medium text-white mb-2">About this tool</h2>
        <p>
          Creator Scout searches the public YouTube Data API to discover
          channels by niche, saves promising creators to a local pipeline, and
          helps you draft outreach. Contact emails are published by creators on
          their channel&apos;s About page — this tool links you there rather
          than scraping, keeping usage within YouTube&apos;s Terms of Service.
        </p>
      </div>
    </div>
  );
}
