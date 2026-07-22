import "server-only";
import { and, eq } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { channels, templates, settings } from "./schema";
import type { ChannelStatus } from "./statuses";

export { CHANNEL_STATUSES } from "./statuses";
export type { ChannelStatus } from "./statuses";

/* --------- shapes returned to the client (snake_case, unchanged API) -------- */

export interface ChannelRow {
  id: string; // youtube channel id (external identifier)
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

/* -------------------------------- settings -------------------------------- */

export async function getSetting(
  workspaceId: string,
  key: string
): Promise<string | null> {
  await ensureReady();
  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(and(eq(settings.workspaceId, workspaceId), eq(settings.key, key)))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function setSetting(
  workspaceId: string,
  key: string,
  value: string
): Promise<void> {
  await ensureReady();
  await db
    .insert(settings)
    .values({ workspaceId, key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

/* -------------------------------- channels -------------------------------- */

function toChannelRow(c: typeof channels.$inferSelect): ChannelRow {
  return {
    id: c.ytId,
    title: c.title,
    description: c.description ?? "",
    thumbnail: c.thumbnail ?? "",
    custom_url: c.customUrl ?? "",
    country: c.country ?? "",
    subscriber_count: c.subscriberCount ?? 0,
    video_count: c.videoCount ?? 0,
    view_count: c.viewCount ?? 0,
    niche: c.niche ?? "",
    status: (c.status as ChannelStatus) ?? "to_contact",
    email: c.email ?? "",
    notes: c.notes ?? "",
    saved_at: (c.savedAt instanceof Date
      ? c.savedAt
      : new Date(c.savedAt)
    ).toISOString(),
    updated_at: (c.updatedAt instanceof Date
      ? c.updatedAt
      : new Date(c.updatedAt)
    ).toISOString(),
  };
}

export async function listChannelIds(projectId: string): Promise<string[]> {
  await ensureReady();
  const rows = await db
    .select({ ytId: channels.ytId })
    .from(channels)
    .where(eq(channels.projectId, projectId));
  return rows.map((r) => r.ytId);
}

export async function getChannelRow(
  projectId: string,
  ytId: string
): Promise<ChannelRow | null> {
  await ensureReady();
  const rows = await db
    .select()
    .from(channels)
    .where(and(eq(channels.projectId, projectId), eq(channels.ytId, ytId)))
    .limit(1);
  return rows[0] ? toChannelRow(rows[0]) : null;
}

export async function listChannels(projectId: string): Promise<ChannelRow[]> {
  await ensureReady();
  const rows = await db
    .select()
    .from(channels)
    .where(eq(channels.projectId, projectId));
  return rows
    .map(toChannelRow)
    .sort((a, b) => b.saved_at.localeCompare(a.saved_at));
}

export interface ChannelInput {
  id: string; // youtube channel id
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

export async function upsertChannel(
  projectId: string,
  workspaceId: string,
  input: ChannelInput
): Promise<void> {
  await ensureReady();
  const base = {
    title: input.title,
    description: input.description ?? "",
    thumbnail: input.thumbnail ?? "",
    customUrl: input.customUrl ?? "",
    country: input.country ?? "",
    subscriberCount: input.subscriberCount ?? 0,
    videoCount: input.videoCount ?? 0,
    viewCount: input.viewCount ?? 0,
    updatedAt: new Date(),
  };
  await db
    .insert(channels)
    .values({
      projectId,
      workspaceId,
      ytId: input.id,
      niche: input.niche ?? "",
      ...base,
    })
    .onDuplicateKeyUpdate({ set: base });
}

const EDITABLE_CHANNEL_FIELDS = ["status", "email", "notes", "niche"] as const;
export type EditableChannelField = (typeof EDITABLE_CHANNEL_FIELDS)[number];

export async function updateChannel(
  projectId: string,
  ytId: string,
  patch: Partial<Record<EditableChannelField, string>>
): Promise<boolean> {
  await ensureReady();
  const set: Record<string, string | Date> = { updatedAt: new Date() };
  for (const field of EDITABLE_CHANNEL_FIELDS) {
    const value = patch[field];
    if (typeof value === "string") set[field] = value;
  }
  const result = await db
    .update(channels)
    .set(set)
    .where(and(eq(channels.projectId, projectId), eq(channels.ytId, ytId)));
  // mysql2 returns affectedRows via the driver result
  const affected = (result as unknown as [{ affectedRows: number }])[0]
    ?.affectedRows;
  return affected ? affected > 0 : true;
}

export async function deleteChannel(
  projectId: string,
  ytId: string
): Promise<void> {
  await ensureReady();
  await db
    .delete(channels)
    .where(and(eq(channels.projectId, projectId), eq(channels.ytId, ytId)));
}

/* ------------------------------- templates -------------------------------- */

function toTemplateRow(t: typeof templates.$inferSelect): TemplateRow {
  return {
    id: t.id,
    name: t.name,
    subject: t.subject ?? "",
    body: t.body,
    created_at: (t.createdAt instanceof Date
      ? t.createdAt
      : new Date(t.createdAt)
    ).toISOString(),
  };
}

export async function listTemplates(
  workspaceId: string
): Promise<TemplateRow[]> {
  await ensureReady();
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.workspaceId, workspaceId));
  return rows.map(toTemplateRow).sort((a, b) => a.id - b.id);
}

export async function createTemplate(
  workspaceId: string,
  name: string,
  subject: string,
  body: string
): Promise<number> {
  await ensureReady();
  const result = await db
    .insert(templates)
    .values({ workspaceId, name, subject, body });
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  return insertId ?? 0;
}

export async function updateTemplate(
  workspaceId: string,
  id: number,
  name: string,
  subject: string,
  body: string
): Promise<boolean> {
  await ensureReady();
  const rows = await db
    .select({ id: templates.id })
    .from(templates)
    .where(and(eq(templates.workspaceId, workspaceId), eq(templates.id, id)))
    .limit(1);
  if (rows.length === 0) return false;
  await db
    .update(templates)
    .set({ name, subject, body })
    .where(and(eq(templates.workspaceId, workspaceId), eq(templates.id, id)));
  return true;
}

export async function deleteTemplate(
  workspaceId: string,
  id: number
): Promise<void> {
  await ensureReady();
  await db
    .delete(templates)
    .where(and(eq(templates.workspaceId, workspaceId), eq(templates.id, id)));
}
