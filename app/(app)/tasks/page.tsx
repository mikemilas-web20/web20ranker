"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Task {
  id: string;
  yt_id: string;
  channel_title: string;
  title: string;
  due_date: string;
  done: boolean;
  created_at: string;
}

function todayStr(): string {
  // local date as YYYY-MM-DD
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dueLabel(due: string, today: string): { text: string; tone: string } {
  if (!due) return { text: "No date", tone: "text-ink-dim" };
  if (due < today) return { text: `Overdue · ${due}`, tone: "text-crit" };
  if (due === today) return { text: "Due today", tone: "text-warn" };
  return { text: `Due ${due}`, tone: "text-ink-dim" };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const today = todayStr();

  const load = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((j) => {
        setTasks(j.tasks ?? []);
        setProjectName(j.project?.name ?? null);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate: due }),
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

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const overdue = open.filter((t) => t.due_date && t.due_date < today).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Tasks</h1>
        <p className="text-ink-dim text-sm mt-1">
          Follow-ups for{" "}
          <span className="text-accent">{projectName ?? "this project"}</span>
          {overdue > 0 && (
            <span className="text-crit"> · {overdue} overdue</span>
          )}
        </p>
      </div>

      <Card block>
        <form onSubmit={addTask} className="flex gap-2 items-end flex-wrap">
          <label className="flex flex-col gap-1.5 flex-1 min-w-48">
            <span className="label">New task</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up with Keto Kitchen if no reply"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Due</span>
            <Input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="!w-40"
            />
          </label>
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            Add task
          </Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {open.length === 0 && (
            <div className="text-center text-ink-dim py-10 text-sm border border-dashed border-line">
              No open tasks. Nice and clear.
            </div>
          )}
          {open.map((t) => {
            const d = dueLabel(t.due_date, today);
            return (
              <Card key={t.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggle(t)}
                  className="w-5 h-5 shrink-0 border border-line-strong hover:border-accent"
                  aria-label="Mark done"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-ink">{t.title}</div>
                  <div className="font-mono text-[11px] flex gap-2 mt-0.5">
                    <span className={d.tone}>{d.text}</span>
                    {t.channel_title && (
                      <Link
                        href={`/channel/${t.yt_id}`}
                        className="text-ink-dim hover:text-accent"
                      >
                        · {t.channel_title}
                      </Link>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="px-2 py-1 text-ink-dim hover:text-crit border border-line"
                  title="Delete"
                >
                  ✕
                </button>
              </Card>
            );
          })}

          {done.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowDone((s) => !s)}
                className="label hover:text-ink"
              >
                {showDone ? "▾" : "▸"} Done ({done.length})
              </button>
              {showDone && (
                <div className="flex flex-col gap-2 mt-2">
                  {done.map((t) => (
                    <Card
                      key={t.id}
                      className="flex items-center gap-3 opacity-60"
                    >
                      <button
                        onClick={() => toggle(t)}
                        className="w-5 h-5 shrink-0 bg-good/20 border border-good grid place-items-center text-good text-xs"
                        aria-label="Mark not done"
                      >
                        ✓
                      </button>
                      <div className="flex-1 min-w-0 text-ink-dim line-through">
                        {t.title}
                      </div>
                      <button
                        onClick={() => remove(t.id)}
                        className="px-2 py-1 text-ink-dim hover:text-crit border border-line"
                      >
                        ✕
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
