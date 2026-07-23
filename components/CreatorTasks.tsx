"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Task {
  id: string;
  title: string;
  due_date: string;
  done: boolean;
}

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CreatorTasks({
  channelId,
  channelTitle,
}: {
  channelId: string;
  channelTitle: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const today = todayStr();

  const load = useCallback(() => {
    fetch(`/api/tasks?channel=${encodeURIComponent(channelId)}`)
      .then((r) => r.json())
      .then((j) => setTasks(j.tasks ?? []))
      .catch(() => {});
  }, [channelId]);
  useEffect(load, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate: due, ytId: channelId, channelTitle }),
    });
    setTitle("");
    setDue("");
    load();
  }

  async function toggle(t: Task) {
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
    );
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
  }

  async function remove(id: string) {
    setTasks((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
        Follow-ups
      </h2>
      <form onSubmit={add} className="flex gap-2 items-end flex-wrap">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Send follow-up email"
          className="flex-1 min-w-40"
        />
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="!w-40"
        />
        <Button type="submit" size="sm" variant="primary" disabled={!title.trim()}>
          Add
        </Button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-ink-dim">No follow-ups scheduled.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => {
            const overdue = !t.done && t.due_date && t.due_date < today;
            return (
              <li key={t.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggle(t)}
                  className={`w-5 h-5 shrink-0 border grid place-items-center text-xs ${
                    t.done
                      ? "bg-good/20 border-good text-good"
                      : "border-line-strong hover:border-accent"
                  }`}
                  aria-label="Toggle done"
                >
                  {t.done ? "✓" : ""}
                </button>
                <span
                  className={`flex-1 text-sm ${t.done ? "line-through text-ink-dim" : "text-ink"}`}
                >
                  {t.title}
                </span>
                {t.due_date && (
                  <span
                    className={`font-mono text-[11px] ${overdue ? "text-crit" : "text-ink-dim"}`}
                  >
                    {t.due_date}
                  </span>
                )}
                <button
                  onClick={() => remove(t.id)}
                  className="text-ink-dim hover:text-crit px-1"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
