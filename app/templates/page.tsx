"use client";

import { useEffect, useState } from "react";

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
        <h1 className="text-2xl font-semibold text-white">Message templates</h1>
        <p className="text-slate-400 text-sm mt-1">
          Reusable outreach templates. Placeholders are filled in per channel.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3 h-fit"
        >
          <h2 className="text-lg font-medium text-white">
            {editing ? "Edit template" : "New template"}
          </h2>
          <label className="text-sm flex flex-col gap-1">
            <span className="text-slate-400">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Collaboration intro"
              className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
            />
          </label>
          <label className="text-sm flex flex-col gap-1">
            <span className="text-slate-400">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Collaboration idea for {{channel_name}}"
              className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
            />
          </label>
          <label className="text-sm flex flex-col gap-1">
            <span className="text-slate-400">Body</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Hi {{channel_name}} team, …"
              className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <div className="text-xs text-slate-500">
            Placeholders:{" "}
            {PLACEHOLDERS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setBody((b) => `${b}{{${p}}}`)}
                className="inline-block m-0.5 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
              >
                {`{{${p}}}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!name.trim() || !body.trim()}
              className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-sm"
            >
              {editing ? "Save changes" : "Add template"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-3">
          {templates.length === 0 ? (
            <p className="text-slate-500 text-sm">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-white">{t.name}</h3>
                  <div className="flex gap-1 text-sm">
                    <button
                      onClick={() => startEdit(t)}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="px-2.5 py-1 rounded-md text-slate-500 hover:text-rose-300 hover:bg-rose-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {t.subject && (
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="text-slate-600">Subject:</span> {t.subject}
                  </p>
                )}
                <p className="text-sm text-slate-400 mt-2 whitespace-pre-line line-clamp-4">
                  {t.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
