"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCount, channelUrl, fillTemplate, STATUS_LABELS } from "@/lib/format";
import { CHANNEL_STATUSES } from "@/lib/statuses";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import ActivityFeed from "@/components/ActivityFeed";
import CreatorTasks from "@/components/CreatorTasks";

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
    return <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>;
  if (error || !channel)
    return (
      <div className="border border-crit/50 bg-crit/10 text-ink px-4 py-3 text-sm">
        {error || "Channel not found"}{" "}
        <Link href="/settings" className="text-accent underline">
          Check Settings
        </Link>
      </div>
    );

  const stats: [string, string][] = [
    [formatCount(channel.subscriberCount), "Subscribers"],
    [formatCount(channel.videoCount), "Videos"],
    [formatCount(channel.viewCount), "Total views"],
    [String(new Date(channel.publishedAt).getFullYear() || "?"), "Since"],
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        {channel.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.thumbnail}
            alt=""
            className="w-20 h-20 object-cover border border-line shadow-block-sm"
          />
        )}
        <div className="flex-1 min-w-64">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {channel.title}
          </h1>
          {channel.country && (
            <div className="font-mono text-[11px] text-ink-dim mt-1">
              {channel.customUrl || channel.id} · {channel.country}
            </div>
          )}
          <div className="flex gap-2 mt-3 flex-wrap">
            {!saved ? (
              <Button variant="primary" size="sm" onClick={saveChannel}>
                Save for outreach
              </Button>
            ) : (
              <Select
                value={saved.status}
                onChange={(e) => patchSaved({ status: e.target.value })}
                aria-label="Status"
                className="w-auto !py-1.5 text-sm"
              >
                {CHANNEL_STATUSES.map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABELS[k]}
                  </option>
                ))}
              </Select>
            )}
            <ButtonLink
              size="sm"
              variant="default"
              href={channelUrl(channel.id, channel.customUrl)}
              external
              target="_blank"
              rel="noreferrer"
            >
              Channel ↗
            </ButtonLink>
            <ButtonLink
              size="sm"
              variant="default"
              href={`${channelUrl(channel.id, channel.customUrl)}/about`}
              external
              target="_blank"
              rel="noreferrer"
              title="Business emails are usually listed on the About page"
            >
              About page ↗
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-line divide-x divide-y sm:divide-y-0 divide-line">
        {stats.map(([n, l]) => (
          <div key={l} className="p-4">
            <div className="text-xl font-bold tabular-nums text-ink">{n}</div>
            <div className="label !text-[9px] mt-1">{l}</div>
          </div>
        ))}
      </div>

      {channel.description && (
        <p className="text-sm text-ink-dim whitespace-pre-line max-w-3xl">
          {channel.description}
        </p>
      )}

      {/* Recent videos */}
      {videos.length > 0 && (
        <section>
          <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim mb-3">
            Recent uploads
          </h2>
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
                    className="w-full aspect-video object-cover border border-line group-hover:border-accent"
                  />
                )}
                <p className="text-xs text-ink mt-1.5 line-clamp-2 group-hover:text-accent">
                  {v.title}
                </p>
                {v.publishedAt && (
                  <p className="font-mono text-[10px] text-ink-dim">
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
        <Card className="flex flex-col gap-3">
          <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
            Contact info
          </h2>
          {!saved ? (
            <p className="text-sm text-ink-dim">
              Save this channel to track contact info and notes.
            </p>
          ) : (
            <>
              <Field
                label="Email"
                hint="Find it on the channel's About page → “View email address”"
              >
                <Input
                  defaultValue={saved.email}
                  placeholder="creator@example.com"
                  onBlur={(e) =>
                    e.target.value !== saved.email &&
                    patchSaved({ email: e.target.value })
                  }
                />
              </Field>
              <Field label="Niche tag">
                <Input
                  defaultValue={saved.niche}
                  placeholder="e.g. keto recipes"
                  onBlur={(e) =>
                    e.target.value !== saved.niche &&
                    patchSaved({ niche: e.target.value })
                  }
                />
              </Field>
              <Field label="Notes" className="flex-1">
                <Textarea
                  defaultValue={saved.notes}
                  rows={5}
                  placeholder="Audience fit, rates, past collabs…"
                  onBlur={(e) =>
                    e.target.value !== saved.notes &&
                    patchSaved({ notes: e.target.value })
                  }
                />
              </Field>
            </>
          )}
        </Card>

        <Card block className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
              Compose outreach
            </h2>
            <Link href="/templates" className="text-xs text-accent underline">
              Edit templates
            </Link>
          </div>
          {templates.length === 0 ? (
            <p className="text-sm text-ink-dim">No templates yet.</p>
          ) : (
            <>
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
              {renderedSubject && (
                <div className="flex gap-2 items-center">
                  <Input readOnly value={renderedSubject} className="flex-1" />
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => copy(renderedSubject, "subject")}
                  >
                    {copied === "subject" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              )}
              <Textarea
                readOnly
                value={renderedBody}
                rows={12}
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => copy(renderedBody, "body")}
                >
                  {copied === "body" ? "Copied!" : "Copy message"}
                </Button>
                {saved?.email && (
                  <ButtonLink
                    size="sm"
                    variant="primary"
                    href={`mailto:${saved.email}?subject=${encodeURIComponent(renderedSubject)}&body=${encodeURIComponent(renderedBody)}`}
                    external
                    onClick={() =>
                      saved.status === "to_contact" &&
                      patchSaved({ status: "contacted" })
                    }
                  >
                    Open in email client
                  </ButtonLink>
                )}
              </div>
              {!senderName && (
                <p className="text-xs text-ink-dim">
                  Tip: set your name in{" "}
                  <Link href="/settings" className="text-accent underline">
                    Settings
                  </Link>{" "}
                  to fill {"{{my_name}}"} automatically.
                </p>
              )}
            </>
          )}
        </Card>
      </section>

      {/* CRM: follow-ups + activity timeline (once saved) */}
      {saved && (
        <section className="grid md:grid-cols-2 gap-6">
          <CreatorTasks channelId={channel.id} channelTitle={channel.title} />
          <ActivityFeed channelId={channel.id} />
        </section>
      )}
    </div>
  );
}
