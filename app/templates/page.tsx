"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Field } from "@/components/ui/Input";

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

const PLACEHOLDERS = [
  "channel_name",
  "channel_url",
  "subscribers",
  "recent_video_title",
  "niche",
  "my_name",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function load() {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((j) => setTemplates(j.templates));
  }
  useEffect(load, []);

  function reset() {
    setEditing(null);
    setName("");
    setSubject("");
    setBody("");
  }

  function startEdit(t: Template) {
    setEditing(t);
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    const payload = { name, subject, body };
    if (editing) {
      await fetch(`/api/templates/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    reset();
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (editing?.id === id) reset();
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Message templates
        </h1>
        <p className="text-ink-dim text-sm mt-1">
          Reusable outreach templates. Placeholders are filled in per channel.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card block className="h-fit">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
              {editing ? "Edit template" : "New template"}
            </h2>
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Collaboration intro"
              />
            </Field>
            <Field label="Subject">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Collaboration idea for {{channel_name}}"
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Hi {{channel_name}} team, …"
                className="font-mono"
              />
            </Field>
            <div className="text-xs text-ink-dim flex flex-wrap gap-1.5 items-center">
              <span className="label !text-[10px]">Insert:</span>
              {PLACEHOLDERS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setBody((b) => `${b}{{${p}}}`)}
                  className="font-mono px-1.5 py-0.5 bg-surface-2 hover:border-accent border border-line text-ink-dim hover:text-ink"
                >
                  {`{{${p}}}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!name.trim() || !body.trim()}
              >
                {editing ? "Save changes" : "Add template"}
              </Button>
              {editing && (
                <Button type="button" size="sm" variant="ghost" onClick={reset}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-3">
          {templates.length === 0 ? (
            <p className="text-ink-dim text-sm">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{t.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:!text-crit"
                      onClick={() => remove(t.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {t.subject && (
                  <p className="text-xs text-ink-dim mt-2 font-mono">
                    <span className="text-ink-dim/60">subject:</span> {t.subject}
                  </p>
                )}
                <p className="text-sm text-ink-dim mt-2 whitespace-pre-line line-clamp-4">
                  {t.body}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
