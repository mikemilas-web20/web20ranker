import "server-only";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { projects, channels } from "./schema";
import { genId } from "./ids";

const ACTIVE_COOKIE = "cs_project";

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  channel_count: number;
}

function toRow(p: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date | string;
  count?: number;
}): ProjectRow {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    status: p.status,
    created_at: (p.createdAt instanceof Date
      ? p.createdAt
      : new Date(p.createdAt)
    ).toISOString(),
    channel_count: Number(p.count ?? 0),
  };
}

export async function listProjects(
  workspaceId: string
): Promise<ProjectRow[]> {
  await ensureReady();
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      createdAt: projects.createdAt,
      count: sql<number>`count(${channels.ytId})`,
    })
    .from(projects)
    .leftJoin(channels, eq(channels.projectId, projects.id))
    .where(eq(projects.workspaceId, workspaceId))
    .groupBy(
      projects.id,
      projects.name,
      projects.description,
      projects.status,
      projects.createdAt
    );
  return rows
    .map(toRow)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getProject(
  workspaceId: string,
  id: string
): Promise<ProjectRow | null> {
  await ensureReady();
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
    .limit(1);
  return rows[0] ? toRow(rows[0]) : null;
}

export async function getDefaultProject(
  workspaceId: string
): Promise<ProjectRow | null> {
  const all = await listProjects(workspaceId);
  return all[0] ?? null;
}

export async function createProject(
  workspaceId: string,
  name: string,
  description = ""
): Promise<string> {
  await ensureReady();
  const id = genId();
  await db.insert(projects).values({
    id,
    workspaceId,
    name: name.trim() || "Untitled project",
    description,
    status: "active",
  });
  return id;
}

export async function updateProject(
  workspaceId: string,
  id: string,
  patch: { name?: string; description?: string; status?: string }
): Promise<boolean> {
  await ensureReady();
  const set: Record<string, string> = {};
  if (typeof patch.name === "string") set.name = patch.name.trim();
  if (typeof patch.description === "string")
    set.description = patch.description;
  if (patch.status === "active" || patch.status === "archived")
    set.status = patch.status;
  if (Object.keys(set).length === 0) return false;

  const found = await getProject(workspaceId, id);
  if (!found) return false;
  await db
    .update(projects)
    .set(set)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)));
  return true;
}

/** Deletes a project and its saved channels. Refuses to delete the last one. */
export async function deleteProject(
  workspaceId: string,
  id: string
): Promise<{ ok: boolean; reason?: string }> {
  await ensureReady();
  const all = await listProjects(workspaceId);
  if (all.length <= 1) {
    return { ok: false, reason: "You need at least one project." };
  }
  if (!all.some((p) => p.id === id)) {
    return { ok: false, reason: "Project not found." };
  }
  await db.delete(channels).where(eq(channels.projectId, id));
  await db
    .delete(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)));
  return { ok: true };
}

export interface ActiveProject {
  id: string;
  name: string;
}

/** The caller's active project — from cookie if valid, else the default. */
export async function getActiveProject(
  workspaceId: string
): Promise<ActiveProject | null> {
  const store = await cookies();
  const cookieId = store.get(ACTIVE_COOKIE)?.value;
  if (cookieId) {
    const p = await getProject(workspaceId, cookieId);
    if (p) return { id: p.id, name: p.name };
  }
  const def = await getDefaultProject(workspaceId);
  return def ? { id: def.id, name: def.name } : null;
}

export async function setActiveProjectCookie(projectId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_COOKIE, projectId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
