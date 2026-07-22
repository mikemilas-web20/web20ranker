"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Field } from "@/components/ui/Input";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  channel_count: number;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((j) => {
        setProjects(j.projects);
        setActiveId(j.activeId);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName("");
    setDescription("");
    setCreating(false);
    load();
    router.refresh();
  }

  async function setActive(id: string) {
    await fetch("/api/projects/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    setActiveId(id);
    router.refresh();
  }

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setEditingId(null);
    load();
    router.refresh();
  }

  async function remove(id: string, count: number) {
    const msg =
      count > 0
        ? `Delete this project and its ${count} saved creator${count === 1 ? "" : "s"}? This can't be undone.`
        : "Delete this project?";
    if (!confirm(msg)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error || "Could not delete project");
      return;
    }
    load();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Projects</h1>
        <p className="text-ink-dim text-sm mt-1">
          Organize outreach into campaigns. Discovering and saving creators
          adds them to your active project.
        </p>
      </div>

      <Card block className="flex flex-col gap-4">
        <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
          New project
        </h2>
        <form onSubmit={create} className="flex flex-col gap-3">
          <div className="flex gap-2 items-end flex-wrap">
            <Field label="Name" className="flex-1 min-w-48">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 kitchenware campaign"
                required
              />
            </Field>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Creating…" : "Create project"}
            </Button>
          </div>
          <Field label="Description (optional)">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Who's this campaign for, goals, notes…"
            />
          </Field>
        </form>
      </Card>

      {loading ? (
        <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              className={
                p.id === activeId ? "border-accent/50" : undefined
              }
            >
              <div className="flex items-start gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  {editingId === p.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="!w-64"
                        autoFocus
                      />
                      <Button size="sm" variant="primary" onClick={() => saveRename(p.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      {p.id === activeId && (
                        <span className="font-mono text-[10px] uppercase tracking-wide text-accent border border-accent/40 px-1.5 py-0.5">
                          active
                        </span>
                      )}
                    </div>
                  )}
                  {p.description && (
                    <p className="text-sm text-ink-dim mt-1">{p.description}</p>
                  )}
                  <div className="font-mono text-[11px] text-ink-dim mt-1">
                    {p.channel_count} creator{p.channel_count === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {p.id !== activeId && (
                    <Button size="sm" variant="default" onClick={() => setActive(p.id)}>
                      Set active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:!text-crit"
                    onClick={() => remove(p.id, p.channel_count)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
