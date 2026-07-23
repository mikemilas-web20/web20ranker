import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureReady, pool } from "./drizzle";
import { searchHistory, savedSearches } from "./schema";
import { genId } from "./ids";

const HISTORY_KEEP = 40;

export interface SearchFilters {
  region?: string;
  activeDays?: string;
  minSubs?: string;
  maxSubs?: string;
}

export interface SearchEntry {
  id: string;
  query: string;
  mode: string;
  filters: SearchFilters;
  created_at: string;
}
export interface HistoryEntry extends SearchEntry {
  result_count: number;
}
export interface SavedSearchEntry extends SearchEntry {
  name: string;
}

function parseFilters(raw: string | null): SearchFilters {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SearchFilters;
  } catch {
    return {};
  }
}

function iso(d: Date | string): string {
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

export async function logSearch(
  projectId: string,
  entry: { query: string; mode: string; filters: SearchFilters; resultCount: number }
): Promise<void> {
  await ensureReady();
  await db.insert(searchHistory).values({
    id: genId(),
    projectId,
    query: entry.query.slice(0, 255),
    mode: entry.mode,
    filters: JSON.stringify(entry.filters ?? {}),
    resultCount: entry.resultCount,
  });
  // Keep only the most recent HISTORY_KEEP rows per project.
  await pool.query(
    `DELETE FROM search_history WHERE project_id = ? AND id NOT IN (
       SELECT id FROM (
         SELECT id FROM search_history WHERE project_id = ?
         ORDER BY created_at DESC LIMIT ${HISTORY_KEEP}
       ) keep
     )`,
    [projectId, projectId]
  );
}

export async function listHistory(
  projectId: string,
  limit = 15
): Promise<HistoryEntry[]> {
  await ensureReady();
  const rows = await db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.projectId, projectId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    query: r.query,
    mode: r.mode,
    filters: parseFilters(r.filters),
    result_count: r.resultCount ?? 0,
    created_at: iso(r.createdAt),
  }));
}

export async function clearHistory(projectId: string): Promise<void> {
  await ensureReady();
  await db.delete(searchHistory).where(eq(searchHistory.projectId, projectId));
}

export async function listSavedSearches(
  projectId: string
): Promise<SavedSearchEntry[]> {
  await ensureReady();
  const rows = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.projectId, projectId))
    .orderBy(desc(savedSearches.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    query: r.query,
    mode: r.mode,
    filters: parseFilters(r.filters),
    created_at: iso(r.createdAt),
  }));
}

export async function createSavedSearch(
  projectId: string,
  name: string,
  entry: { query: string; mode: string; filters: SearchFilters }
): Promise<string> {
  await ensureReady();
  const id = genId();
  await db.insert(savedSearches).values({
    id,
    projectId,
    name: name.slice(0, 160),
    query: entry.query.slice(0, 255),
    mode: entry.mode,
    filters: JSON.stringify(entry.filters ?? {}),
  });
  return id;
}

export async function deleteSavedSearch(
  projectId: string,
  id: string
): Promise<void> {
  await ensureReady();
  await db
    .delete(savedSearches)
    .where(
      and(eq(savedSearches.projectId, projectId), eq(savedSearches.id, id))
    );
}
