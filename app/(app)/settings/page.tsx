"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import GmailConnect from "@/components/GmailConnect";

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
    return <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>;

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-ink-dim text-sm mt-1">
          Configure your YouTube API access and outreach identity.
        </p>
      </div>

      <Card block>
        <form onSubmit={save} className="flex flex-col gap-5">
          <Field
            label="YouTube Data API v3 key"
            hint={
              <>
                Get one free from the{" "}
                <a
                  href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Google Cloud Console
                </a>{" "}
                — enable “YouTube Data API v3” and create an API key. Free quota
                is 10,000 units/day.
              </>
            }
          >
            {hasApiKey && (
              <p className="text-xs text-good mb-1">
                ✓ A key is configured ({apiKeyMasked}). Enter a new one to
                replace it.
              </p>
            )}
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              placeholder={hasApiKey ? "Enter new key to replace" : "AIza…"}
            />
          </Field>

          <Field
            label="Your name"
            hint="Used to fill {{my_name}} in templates"
          >
            <Input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Alex Rivera"
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary">
              Save settings
            </Button>
            {saved && <span className="text-sm text-good">Saved ✓</span>}
          </div>
        </form>
      </Card>

      <GmailConnect />

      <Card className="text-sm text-ink-dim">
        <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim mb-2">
          About this tool
        </h2>
        <p>
          Creator Scout searches the public YouTube Data API to discover
          channels by niche, saves promising creators to your pipeline, and
          helps you draft outreach. Contact emails are published by creators on
          their channel&apos;s About page — this tool links you there rather
          than scraping, keeping usage within YouTube&apos;s Terms of Service.
        </p>
      </Card>
    </div>
  );
}
