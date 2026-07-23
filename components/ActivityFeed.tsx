"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

interface Activity {
  id: string;
  type: string;
  body: string;
  created_at: string;
}

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityFeed({ channelId }: { channelId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/saved/${channelId}/activity`)
      .then((r) => r.json())
      .then((j) => setActivities(j.activities ?? []))
      .catch(() => {});
  }, [channelId]);
  useEffect(load, [load]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    await fetch(`/api/saved/${channelId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: note, type: "note" }),
    });
    setNote("");
    setSaving(false);
    load();
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
        Activity
      </h2>
      <form onSubmit={addNote} className="flex flex-col gap-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Log a note — call summary, what you sent, next step…"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={saving || !note.trim()}
          className="self-start"
        >
          Add note
        </Button>
      </form>

      {activities.length === 0 ? (
        <p className="text-sm text-ink-dim">
          No activity yet. Status changes and notes will show here.
        </p>
      ) : (
        <ol className="flex flex-col gap-3 mt-1">
          {activities.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span
                className={`mt-1 w-2 h-2 shrink-0 rounded-full ${
                  a.type === "status"
                    ? "bg-accent"
                    : a.type === "note"
                      ? "bg-info"
                      : "bg-ink-dim"
                }`}
              />
              <div className="min-w-0">
                <div className="text-sm text-ink whitespace-pre-line">
                  {a.body}
                </div>
                <div className="font-mono text-[10px] text-ink-dim mt-0.5">
                  {a.type} · {when(a.created_at)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
