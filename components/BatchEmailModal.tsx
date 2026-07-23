"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

interface Template {
  id: number;
  name: string;
}
interface SelChannel {
  id: string;
  title: string;
  email: string;
}
interface SendResult {
  id: string;
  title: string;
  status: string;
  detail?: string;
}

export default function BatchEmailModal({
  channels,
  onClose,
  onSent,
}: {
  channels: SelChannel[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [gmail, setGmail] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((j) => {
        setTemplates(j.templates ?? []);
        if (j.templates?.length) setTemplateId(j.templates[0].id);
      });
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then(setGmail)
      .catch(() => setGmail({ connected: false, email: null }));
  }, []);

  const withEmail = channels.filter((c) => c.email).length;

  async function send() {
    if (!templateId) return;
    setSending(true);
    const res = await fetch("/api/gmail/send-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: channels.map((c) => c.id), templateId }),
    });
    const j = await res.json().catch(() => null);
    setSending(false);
    if (!res.ok) {
      setResults([{ id: "-", title: j?.error || "Send failed", status: "failed" }]);
      return;
    }
    setResults(j.results ?? []);
    onSent();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface border border-line-strong shadow-block flex flex-col gap-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
            Send email to {channels.length} creator
            {channels.length === 1 ? "" : "s"}
          </h2>
          <button onClick={onClose} className="text-ink-dim hover:text-ink">
            ✕
          </button>
        </div>

        {gmail && !gmail.connected ? (
          <p className="text-sm text-ink-dim">
            Connect your Gmail first in{" "}
            <Link href="/settings" className="text-accent underline">
              Settings
            </Link>{" "}
            to send email.
          </p>
        ) : results ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink">
              {results.filter((r) => r.status === "sent").length} sent ·{" "}
              {results.filter((r) => r.status === "skipped").length} skipped ·{" "}
              {results.filter((r) => r.status === "failed").length} failed
            </p>
            <ul className="max-h-56 overflow-y-auto flex flex-col gap-1 text-sm">
              {results.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <span
                    className={
                      r.status === "sent"
                        ? "text-good"
                        : r.status === "skipped"
                          ? "text-ink-dim"
                          : "text-crit"
                    }
                  >
                    {r.status === "sent" ? "✓" : r.status === "skipped" ? "–" : "✕"}
                  </span>
                  <span className="flex-1 truncate text-ink">{r.title}</span>
                  {r.detail && (
                    <span className="text-xs text-ink-dim">{r.detail}</span>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="primary" onClick={onClose} className="self-end">
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-dim">
              Sending from{" "}
              <span className="font-mono text-good">
                {gmail?.email ?? "your Gmail"}
              </span>
              . {withEmail} of {channels.length} selected have an email on file;
              the rest are skipped. Each message is personalized from the
              template.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="label">Template</span>
              <Select
                value={templateId ?? ""}
                onChange={(e) => setTemplateId(Number(e.target.value))}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={send}
                disabled={sending || withEmail === 0 || !templateId}
              >
                {sending ? "Sending…" : `Send ${withEmail} email${withEmail === 1 ? "" : "s"}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
