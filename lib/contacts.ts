import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { contacts, channels } from "./schema";
import { genId } from "./ids";
import { gatherContactText } from "./youtube";

export type ContactType =
  | "email"
  | "instagram"
  | "facebook"
  | "twitter"
  | "tiktok"
  | "linktree"
  | "discord"
  | "website";

export interface ContactRow {
  id: string;
  yt_id: string;
  type: string;
  value: string;
  source: string;
  created_at: string;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SOCIAL_PATTERNS: { type: ContactType; re: RegExp }[] = [
  { type: "instagram", re: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+/gi },
  { type: "tiktok", re: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[A-Za-z0-9_.]+/gi },
  { type: "twitter", re: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]+/gi },
  { type: "linktree", re: /(?:https?:\/\/)?(?:www\.)?linktr\.ee\/[A-Za-z0-9_.-]+/gi },
  { type: "discord", re: /(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com)\/(?:invite\/)?[A-Za-z0-9-]+/gi },
  { type: "facebook", re: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[A-Za-z0-9_.\-/]+/gi },
];

function normalizeUrl(v: string): string {
  return v.startsWith("http") ? v : `https://${v}`;
}

/** Extract emails + known social links from free text. */
export function extractContacts(text: string): { type: string; value: string }[] {
  const seen = new Set<string>();
  const out: { type: string; value: string }[] = [];

  for (const m of text.matchAll(EMAIL_RE)) {
    const value = m[0].toLowerCase().replace(/[.,;]+$/, "");
    // skip obvious non-contacts
    if (value.length > 100 || /\.(png|jpg|jpeg|gif|webp)$/i.test(value)) continue;
    const key = `email:${value}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ type: "email", value });
    }
  }

  for (const { type, re } of SOCIAL_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = normalizeUrl(m[0].replace(/[).,;]+$/, ""));
      const key = `${type}:${value.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type, value });
      }
    }
  }
  return out.slice(0, 30);
}

/** Map of yt_id -> number of stored contacts, for a whole project. */
export async function contactCountsByChannel(
  projectId: string
): Promise<Record<string, number>> {
  await ensureReady();
  const rows = await db
    .select({
      ytId: contacts.ytId,
      count: sql<number>`count(*)`,
    })
    .from(contacts)
    .where(eq(contacts.projectId, projectId))
    .groupBy(contacts.ytId);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.ytId] = Number(r.count);
  return map;
}

export async function listContacts(
  projectId: string,
  ytId: string
): Promise<ContactRow[]> {
  await ensureReady();
  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.projectId, projectId), eq(contacts.ytId, ytId)))
    .orderBy(asc(contacts.type), asc(contacts.createdAt));
  return rows.map((r) => ({
    id: r.id,
    yt_id: r.ytId,
    type: r.type,
    value: r.value,
    source: r.source,
    created_at: (r.createdAt instanceof Date
      ? r.createdAt
      : new Date(r.createdAt)
    ).toISOString(),
  }));
}

export async function addContact(
  projectId: string,
  ytId: string,
  type: string,
  value: string,
  source = "manual"
): Promise<void> {
  await ensureReady();
  await db.insert(contacts).values({
    id: genId(),
    projectId,
    ytId,
    type,
    value: value.slice(0, 512),
    source,
  });
}

export async function deleteContact(
  projectId: string,
  id: string
): Promise<void> {
  await ensureReady();
  await db
    .delete(contacts)
    .where(and(eq(contacts.projectId, projectId), eq(contacts.id, id)));
}

/** Fetch public text for a creator, extract contacts, and store new ones. */
export async function enrichCreator(
  projectId: string,
  ytId: string,
  apiKey: string
): Promise<{ added: number; contacts: ContactRow[] }> {
  await ensureReady();
  const text = await gatherContactText(apiKey, ytId);
  const found = extractContacts(text);

  const existing = await listContacts(projectId, ytId);
  const existingKeys = new Set(
    existing.map((c) => `${c.type}:${c.value.toLowerCase()}`)
  );

  let added = 0;
  let firstEmail = "";
  for (const f of found) {
    if (f.type === "email" && !firstEmail) firstEmail = f.value;
    const key = `${f.type}:${f.value.toLowerCase()}`;
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      await addContact(projectId, ytId, f.type, f.value, "description");
      added++;
    }
  }

  // Convenience: seed the creator's primary email if it's empty.
  if (firstEmail) {
    const ch = await db
      .select({ email: channels.email })
      .from(channels)
      .where(and(eq(channels.projectId, projectId), eq(channels.ytId, ytId)))
      .limit(1);
    if (ch[0] && !ch[0].email) {
      await db
        .update(channels)
        .set({ email: firstEmail })
        .where(
          and(eq(channels.projectId, projectId), eq(channels.ytId, ytId))
        );
    }
  }

  return { added, contacts: await listContacts(projectId, ytId) };
}
