import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { activities, channels } from "./schema";
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

export interface RecentActivity extends ActivityRow {
  channel_title: string;
}

export async function listRecentActivities(
  projectId: string,
  limit = 8
): Promise<RecentActivity[]> {
  await ensureReady();
  const rows = await db
    .select({
      id: activities.id,
      ytId: activities.ytId,
      type: activities.type,
      body: activities.body,
      createdAt: activities.createdAt,
      title: channels.title,
    })
    .from(activities)
    .leftJoin(
      channels,
      and(
        eq(channels.projectId, activities.projectId),
        eq(channels.ytId, activities.ytId)
      )
    )
    .where(eq(activities.projectId, projectId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    yt_id: r.ytId,
    type: r.type,
    body: r.body ?? "",
    channel_title: r.title ?? "",
    created_at: (r.createdAt instanceof Date
      ? r.createdAt
      : new Date(r.createdAt)
    ).toISOString(),
  }));
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
