import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { tasks } from "./schema";
import { genId } from "./ids";

export interface TaskRow {
  id: string;
  yt_id: string;
  channel_title: string;
  title: string;
  due_date: string;
  done: boolean;
  created_at: string;
}

function toRow(t: typeof tasks.$inferSelect): TaskRow {
  return {
    id: t.id,
    yt_id: t.ytId ?? "",
    channel_title: t.channelTitle ?? "",
    title: t.title,
    due_date: t.dueDate ?? "",
    done: (t.done ?? 0) === 1,
    created_at: (t.createdAt instanceof Date
      ? t.createdAt
      : new Date(t.createdAt)
    ).toISOString(),
  };
}

export async function createTask(
  projectId: string,
  input: {
    title: string;
    dueDate?: string;
    ytId?: string;
    channelTitle?: string;
  }
): Promise<string> {
  await ensureReady();
  const id = genId();
  await db.insert(tasks).values({
    id,
    projectId,
    ytId: input.ytId ?? "",
    channelTitle: input.channelTitle ?? "",
    title: input.title.slice(0, 255),
    dueDate: input.dueDate ?? "",
    done: 0,
  });
  return id;
}

export async function listTasks(
  projectId: string,
  opts: { ytId?: string; onlyOpen?: boolean } = {}
): Promise<TaskRow[]> {
  await ensureReady();
  const conds = [eq(tasks.projectId, projectId)];
  if (opts.ytId !== undefined) conds.push(eq(tasks.ytId, opts.ytId));
  if (opts.onlyOpen) conds.push(eq(tasks.done, 0));
  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conds))
    .orderBy(asc(tasks.done), asc(tasks.dueDate));
  return rows.map(toRow);
}

export async function setTaskDone(
  projectId: string,
  id: string,
  done: boolean
): Promise<boolean> {
  await ensureReady();
  const found = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.id, id)))
    .limit(1);
  if (found.length === 0) return false;
  await db
    .update(tasks)
    .set({ done: done ? 1 : 0 })
    .where(and(eq(tasks.projectId, projectId), eq(tasks.id, id)));
  return true;
}

export async function deleteTask(
  projectId: string,
  id: string
): Promise<void> {
  await ensureReady();
  await db
    .delete(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.id, id)));
}
