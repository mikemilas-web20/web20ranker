"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  formatCount,
  channelUrl,
  fillTemplate,
  STATUS_LABELS,
} from "@/lib/format";

interface ChannelDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  customUrl: string;
  country: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

interface SavedRow {
  status: string;
  email: string;
  notes: string;
  niche: string;
}

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [saved, setSaved] = useState<SavedRow | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [senderName, setSenderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/channel/${id}`).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed to load channel");
        return j;
      }),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([detail, tpl, settings]) => {
        setChannel(detail.channel);
        setVideos(detail.videos);
        setSaved(detail.saved);
        setTemplates(tpl.templates);
        if (tpl.templates.length > 0) setTemplateId(tpl.templates[0].id);
        setSenderName(settings.senderName || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const patchSaved = useCallback(
    async (patch: Partial<SavedRow>) => {
      setSaved((prev) => (prev ? { ...prev, ...patch } : prev));
      await fetch(`/api/saved/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    },
    [id]
  );

  async function saveChannel() {
    if (!channel) return;
    await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(channel),
    });
    setSaved({ status: "to_contact", email: "", notes: "", niche: "" });
  }

  const template = templates.find((t) => t.id === templateId) || null;

  const vars = useMemo((): Record<string, string> => {
    if (!channel) return {};
    return {
      channel_name: channel.title,
      channel_url: channelUrl(channel.id, channel.customUrl),
      subscribers: formatCount(channel.subscriberCount),
      recent_video_title: videos[0]?.title || "your recent video",
      niche: saved?.niche || "",
      my_name: senderName || "[your name]",
    };
  }, [channel, videos, saved, senderName]);

  const renderedSubject = template ? fillTemplate(template.subject, vars) : "";
  const renderedBody = template ? fillTemplate(template.body, vars) : "";

  function copy(text: string, which: "subject" | "body") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (loading)
    return <p className="text-slate-500 text-sm py-8 text-center">Loading…</p>;
  if (error || !channel)
    return (
      <div className="rounded-lg border border-rose-800 bg-rose-950/40 text-rose-200 px-4 py-3 text-sm">
        {error || "Channel not found"}{" "}
        <Link href="/settings" className="underline">
          Check Settings
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        {channel.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.thumbnail}
            alt=""
            className="w-20 h-20 rounded-full object-cover"
          />
        )}
        <div className="flex-1 min-w-64">
          <h1 className="text-2xl font-semibold text-white">{channel.title}</h1>
          <div className="text-sm text-slate-400 flex gap-3 flex-wrap mt-1">
            <span>{formatCount(channel.subscriberCount)} subscribers</span>
            <span>{formatCount(channel.videoCount)} videos</span>
            <span>{formatCount(channel.viewCount)} total views</span>
            {channel.country && <span>{channel.country}</span>}
            <span>
              since {new Date(channel.publishedAt).getFullYear() || "?"}
            </span>
          </div>
          <div className="flex gap-2 mt-3 text-sm">
            {!saved ? (
              <button
                onClick={saveChannel}
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium"
              >
                Save for outreach
              </button>
            ) : (
              <select
                value={saved.status}
                onChange={(e) => patchSaved({ status: e.target.value })}
                className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            <a
              href={channelUrl(channel.id, channel.customUrl)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white"
            >
              Channel ↗
            </a>
            <a
              href={`${channelUrl(channel.id, channel.customUrl)}/about`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white"
              title="Business emails are usually listed on the About page"
            >
              About page ↗
            </a>
          </div>
        </div>
      </div>

      {channel.description && (
        <p className="text-sm text-slate-400 whitespace-pre-line max-w-3xl">
          {channel.description}
        </p>
      )}

      {/* Recent videos */}
      {videos.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-3">Recent videos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {videos.map((v) => (
              <a
                key={v.id}
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noreferrer"
                className="group"
              >
                {v.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail}
                    alt=""
                    className="rounded-lg w-full aspect-video object-cover"
                  />
                )}
                <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 group-hover:underline">
                  {v.title}
                </p>
                {v.publishedAt && (
                  <p className="text-[11px] text-slate-500">
                    {new Date(v.publishedAt).toLocaleDateString()}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Outreach */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3">
          <h2 className="text-lg font-medium text-white">Contact info</h2>
          {!saved ? (
            <p className="text-sm text-slate-500">
              Save this channel to track contact info and notes.
            </p>
          ) : (
            <>
              <label className="text-sm flex flex-col gap-1">
                <span className="text-slate-400">
                  Email{" "}
                  <span className="text-slate-600">
                    (find it on the channel&apos;s About page → &quot;View email
                    address&quot;)
                  </span>
                </span>
                <input
                  defaultValue={saved.email}
                  placeholder="creator@example.com"
                  onBlur={(e) =>
                    e.target.value !== saved.email &&
                    patchSaved({ email: e.target.value })
                  }
                  className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
                />
              </label>
              <label className="text-sm flex flex-col gap-1">
                <span className="text-slate-400">Niche tag</span>
                <input
                  defaultValue={saved.niche}
                  placeholder="e.g. keto recipes"
                  onBlur={(e) =>
                    e.target.value !== saved.niche &&
                    patchSaved({ niche: e.target.value })
                  }
                  className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5"
                />
              </label>
              <label className="text-sm flex flex-col gap-1 flex-1">
                <span className="text-slate-400">Notes</span>
                <textarea
                  defaultValue={saved.notes}
                  rows={5}
                  placeholder="Audience fit, rates, past collabs…"
                  onBlur={(e) =>
                    e.target.value !== saved.notes &&
                    patchSaved({ notes: e.target.value })
                  }
                  className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 flex-1"
                />
              </label>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-white">Compose outreach</h2>
            <Link href="/templates" className="text-xs text-slate-400 underline">
              Edit templates
            </Link>
          </div>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-500">No templates yet.</p>
          ) : (
            <>
              <select
                value={templateId ?? ""}
                onChange={(e) => setTemplateId(Number(e.target.value))}
                className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {renderedSubject && (
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={renderedSubject}
                    className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm text-slate-300"
                  />
                  <button
                    onClick={() => copy(renderedSubject, "subject")}
                    className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs"
                  >
                    {copied === "subject" ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
              <textarea
                readOnly
                value={renderedBody}
                rows={12}
                className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm text-slate-300 font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => copy(renderedBody, "body")}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm text-white"
                >
                  {copied === "body" ? "Copied!" : "Copy message"}
                </button>
                {saved?.email && (
                  <a
                    href={`mailto:${saved.email}?subject=${encodeURIComponent(renderedSubject)}&body=${encodeURIComponent(renderedBody)}`}
                    onClick={() =>
                      saved.status === "to_contact" &&
                      patchSaved({ status: "contacted" })
                    }
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-sm text-white font-medium"
                  >
                    Open in email client
                  </a>
                )}
              </div>
              {!senderName && (
                <p className="text-xs text-slate-500">
                  Tip: set your name in{" "}
                  <Link href="/settings" className="underline">
                    Settings
                  </Link>{" "}
                  to fill {"{{my_name}}"} automatically.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
