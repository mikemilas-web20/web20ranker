"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Status {
  configured: boolean;
  connected: boolean;
  email: string | null;
}

const FEEDBACK: Record<string, { text: string; tone: string }> = {
  connected: { text: "Gmail connected.", tone: "text-good" },
  denied: { text: "Connection cancelled.", tone: "text-ink-dim" },
  badstate: { text: "Security check failed — please try again.", tone: "text-crit" },
  norefresh: {
    text: "Google didn't return a refresh token. Remove the app's access in your Google account, then reconnect.",
    tone: "text-warn",
  },
  notconfigured: {
    text: "Gmail sending isn't set up on the server yet (missing Google credentials).",
    tone: "text-warn",
  },
  error: { text: "Something went wrong connecting Gmail.", tone: "text-crit" },
};

export default function GmailConnect() {
  const [status, setStatus] = useState<Status | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; tone: string } | null>(
    null
  );

  function load() {
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const g = params.get("gmail");
    if (g && FEEDBACK[g]) {
      setFeedback(FEEDBACK[g]);
      // clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function disconnect() {
    await fetch("/api/gmail/disconnect", { method: "POST" });
    load();
  }

  return (
    <Card block className="flex flex-col gap-3">
      <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
        Gmail sending
      </h2>
      {feedback && <p className={`text-sm ${feedback.tone}`}>{feedback.text}</p>}

      {!status ? (
        <p className="text-sm text-ink-dim">Checking…</p>
      ) : !status.configured ? (
        <p className="text-sm text-ink-dim">
          Gmail sending isn&apos;t configured on the server. An admin needs to
          set <span className="font-mono text-ink">GOOGLE_CLIENT_ID</span> and{" "}
          <span className="font-mono text-ink">GOOGLE_CLIENT_SECRET</span> (see
          the setup notes).
        </p>
      ) : status.connected ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-ink">
            Connected as{" "}
            <span className="font-mono text-good">{status.email}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-dim">
            Connect your Gmail to send outreach emails from your own address —
            single or in bulk from the pipeline.
          </p>
          <a
            href="/api/gmail/connect"
            className="inline-flex items-center justify-center gap-2 font-medium border cursor-pointer text-sm px-4 py-2 bg-accent text-accent-ink border-accent shadow-block-sm hover:-translate-x-px hover:-translate-y-px self-start"
          >
            Connect Gmail
          </a>
        </div>
      )}
    </Card>
  );
}
