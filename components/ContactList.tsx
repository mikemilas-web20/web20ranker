"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

interface Contact {
  id: string;
  type: string;
  value: string;
  source: string;
}

const TYPE_LABEL: Record<string, string> = {
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  tiktok: "TikTok",
  linktree: "Linktree",
  discord: "Discord",
  website: "Website",
  other: "Other",
};

function href(c: Contact): string {
  if (c.type === "email") return `mailto:${c.value}`;
  return c.value.startsWith("http") ? c.value : `https://${c.value}`;
}

export default function ContactList({ channelId }: { channelId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [gathering, setGathering] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addType, setAddType] = useState("email");
  const [addValue, setAddValue] = useState("");

  const load = useCallback(() => {
    fetch(`/api/saved/${channelId}/contacts`)
      .then((r) => r.json())
      .then((j) => setContacts(j.contacts ?? []))
      .finally(() => setLoading(false));
  }, [channelId]);
  useEffect(load, [load]);

  async function gather() {
    setGathering(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/saved/${channelId}/enrich`, {
        method: "POST",
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Enrichment failed");
      setContacts(j.contacts ?? []);
      setMsg(
        j.added > 0
          ? `Found ${j.added} new contact${j.added === 1 ? "" : "s"}.`
          : "No new contacts found in descriptions."
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      setGathering(false);
    }
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!addValue.trim()) return;
    const res = await fetch(`/api/saved/${channelId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: addType, value: addValue.trim() }),
    });
    const j = await res.json().catch(() => null);
    if (res.ok) {
      setContacts(j.contacts ?? []);
      setAddValue("");
    }
  }

  async function remove(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
  }

  return (
    <Card className="flex flex-col gap-3 md:col-span-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
          Contacts
        </h2>
        <div className="flex items-center gap-2">
          {msg && <span className="text-xs text-ink-dim">{msg}</span>}
          <Button size="sm" variant="primary" onClick={gather} disabled={gathering}>
            {gathering ? "Gathering…" : "⤓ Gather from YouTube"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-ink-dim">
        Pulls emails and social links from the channel&apos;s and recent
        videos&apos; descriptions (public data via the YouTube API).
      </p>

      {loading ? (
        <p className="text-sm text-ink-dim">Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-ink-dim">
          No contacts yet — try “Gather from YouTube”, or add one manually below.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 border border-line bg-surface-2 px-2.5 py-1.5"
            >
              <span className="label !text-[9px] w-16 shrink-0">
                {TYPE_LABEL[c.type] ?? c.type}
              </span>
              <a
                href={href(c)}
                target={c.type === "email" ? undefined : "_blank"}
                rel="noreferrer"
                className="flex-1 min-w-0 truncate text-sm text-accent hover:underline"
              >
                {c.value}
              </a>
              {c.source === "description" && (
                <span
                  className="text-[10px] text-ink-dim"
                  title="Auto-found from descriptions"
                >
                  auto
                </span>
              )}
              <button
                onClick={() => remove(c.id)}
                className="text-ink-dim hover:text-crit px-1"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addManual} className="flex gap-2 items-end pt-1">
        <label className="flex flex-col gap-1">
          <span className="label">Type</span>
          <Select
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
            className="!w-32"
          >
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </label>
        <Input
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          placeholder="email or link"
          className="flex-1"
        />
        <Button type="submit" size="sm" variant="default" disabled={!addValue.trim()}>
          Add
        </Button>
      </form>
    </Card>
  );
}
