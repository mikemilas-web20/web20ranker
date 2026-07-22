import fs from "fs";
import path from "path";

/**
 * Pure-JS JSON-file store. No native dependencies, so it installs and runs on
 * any Node host (including shared hosting where node-gyp is unavailable).
 * Data lives in data/db.json under the app directory.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export { CHANNEL_STATUSES } from "./statuses";
export type { ChannelStatus } from "./statuses";
import type { ChannelStatus } from "./statuses";

export interface ChannelRow {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  custom_url: string;
  country: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  niche: string;
  status: ChannelStatus;
  email: string;
  notes: string;
  saved_at: string;
  updated_at: string;
}

export interface TemplateRow {
  id: number;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

interface DbShape {
  settings: Record<string, string>;
  channels: ChannelRow[];
  templates: TemplateRow[];
  templateSeq: number;
}

let cache: DbShape | null = null;

function now(): string {
  return new Date().toISOString();
}

function seed(): DbShape {
  const ts = now();
  return {
    settings: {},
    channels: [],
    templateSeq: 2,
    templates: [
      {
        id: 1,
        name: "Collaboration intro",
        subject: "Collaboration idea for {{channel_name}}",
        body: `Hi {{channel_name}} team,

I've been following your channel ({{channel_url}}) and really enjoyed "{{recent_video_title}}". With {{subscribers}} subscribers in the {{niche}} space, your audience is exactly who we'd love to reach.

I'd love to explore a collaboration — whether that's a sponsored segment, a product review, or something more creative.

Would you be open to a quick chat?

Best,
{{my_name}}`,
        created_at: ts,
      },
      {
        id: 2,
        name: "Sponsorship offer",
        subject: "Sponsorship opportunity for {{channel_name}}",
        body: `Hey {{channel_name}},

I work with brands in the {{niche}} niche and think your channel would be a great fit for a paid sponsorship.

If you're taking on sponsors, I'd love to share the details — rates, deliverables, and timeline are all flexible.

Thanks,
{{my_name}}`,
        created_at: ts,
      },
    ],
  };
}

function load(): DbShape {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    cache = {
      settings: parsed.settings ?? {},
      channels: parsed.channels ?? [],
      templates: parsed.templates ?? [],
      templateSeq: parsed.templateSeq ?? (parsed.templates?.length ?? 0),
    };
  } catch {
    cache = seed();
    persist();
  }
  return cache;
}

function persist() {
  if (!cache) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_PATH); // atomic replace
}

/* ------------------------------- settings ------------------------------- */

export function getSetting(key: string): string | null {
  return load().settings[key] ?? null;
}

export function setSetting(key: string, value: string) {
  load().settings[key] = value;
  persist();
}

/* ------------------------------- channels ------------------------------- */

export function listChannelIds(): string[] {
  return load().channels.map((c) => c.id);
}

export function getChannelRow(id: string): ChannelRow | null {
  return load().channels.find((c) => c.id === id) ?? null;
}

export function listChannels(): ChannelRow[] {
  return [...load().channels].sort((a, b) =>
    b.saved_at.localeCompare(a.saved_at)
  );
}

export interface ChannelInput {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  customUrl?: string;
  country?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  niche?: string;
}

export function upsertChannel(input: ChannelInput) {
  const db = load();
  const existing = db.channels.find((c) => c.id === input.id);
  const ts = now();
  if (existing) {
    Object.assign(existing, {
      title: input.title,
      description: input.description ?? "",
      thumbnail: input.thumbnail ?? "",
      custom_url: input.customUrl ?? "",
      country: input.country ?? "",
      subscriber_count: input.subscriberCount ?? 0,
      video_count: input.videoCount ?? 0,
      view_count: input.viewCount ?? 0,
      updated_at: ts,
    });
  } else {
    db.channels.push({
      id: input.id,
      title: input.title,
      description: input.description ?? "",
      thumbnail: input.thumbnail ?? "",
      custom_url: input.customUrl ?? "",
      country: input.country ?? "",
      subscriber_count: input.subscriberCount ?? 0,
      video_count: input.videoCount ?? 0,
      view_count: input.viewCount ?? 0,
      niche: input.niche ?? "",
      status: "to_contact",
      email: "",
      notes: "",
      saved_at: ts,
      updated_at: ts,
    });
  }
  persist();
}

const EDITABLE_CHANNEL_FIELDS = ["status", "email", "notes", "niche"] as const;
export type EditableChannelField = (typeof EDITABLE_CHANNEL_FIELDS)[number];

export function updateChannel(
  id: string,
  patch: Partial<Record<EditableChannelField, string>>
): boolean {
  const channel = load().channels.find((c) => c.id === id);
  if (!channel) return false;
  for (const field of EDITABLE_CHANNEL_FIELDS) {
    const value = patch[field];
    if (typeof value === "string") {
      if (field === "status") channel.status = value as ChannelStatus;
      else channel[field] = value;
    }
  }
  channel.updated_at = now();
  persist();
  return true;
}

export function deleteChannel(id: string) {
  const db = load();
  db.channels = db.channels.filter((c) => c.id !== id);
  persist();
}

/* ------------------------------ templates ------------------------------- */

export function listTemplates(): TemplateRow[] {
  return [...load().templates].sort((a, b) => a.id - b.id);
}

export function createTemplate(
  name: string,
  subject: string,
  body: string
): number {
  const db = load();
  const id = ++db.templateSeq;
  db.templates.push({ id, name, subject, body, created_at: now() });
  persist();
  return id;
}

export function updateTemplate(
  id: number,
  name: string,
  subject: string,
  body: string
): boolean {
  const template = load().templates.find((t) => t.id === id);
  if (!template) return false;
  Object.assign(template, { name, subject, body });
  persist();
  return true;
}

export function deleteTemplate(id: number) {
  const db = load();
  db.templates = db.templates.filter((t) => t.id !== id);
  persist();
}
