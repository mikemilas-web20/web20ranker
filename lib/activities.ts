import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { activities } from "./schema";
import { genId } from "./ids";

export interface ActivityRow {
  id: string;
  yt_id: string;
  type: string;
  body: string;
  created_at: string;
}

export async function logActivity(
  projectId: string,
  ytId: string,
  type: string,
  body: string,
  userId = ""
): Promise<void> {
  await ensureReady();
  await db.insert(activities).values({
    id: genId(),
    projectId,
    ytId,
    userId,
    type,
    body: body.slice(0, 2000),
  });
}

export async function listActivities(
  projectId: string,
  ytId: string
): Promise<ActivityRow[]> {
  await ensureReady();
  const rows = await db
    .select()
    .from(activities)
    .where(
      and(eq(activities.projectId, projectId), eq(activities.ytId, ytId))
    )
    .orderBy(desc(activities.createdAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    yt_id: r.ytId,
    type: r.type,
    body: r.body ?? "",
    created_at: (r.createdAt instanceof Date
      ? r.createdAt
      : new Date(r.createdAt)
    ).toISOString(),
  }));
}
