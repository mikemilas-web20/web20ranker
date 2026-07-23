import "server-only";
import { listChannels } from "./db";
import { listRecentActivities, type RecentActivity } from "./activities";
import { listTasks, type TaskRow } from "./tasks";
import { CHANNEL_STATUSES } from "./statuses";

export interface DashboardStats {
  total: number;
  withEmail: number;
  funnel: { status: string; count: number }[];
  engaged: number; // moved past "to contact"
  responded: number; // replied + in talks + won
  won: number;
  responseRate: number; // responded / engaged
  winRate: number; // won / engaged
  niches: { niche: string; count: number }[];
  recentActivities: RecentActivity[];
  openTasks: TaskRow[];
  overdueTasks: number;
}

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function getDashboardStats(
  projectId: string
): Promise<DashboardStats> {
  const [channels, recentActivities, openTasks] = await Promise.all([
    listChannels(projectId),
    listRecentActivities(projectId, 8),
    listTasks(projectId, { onlyOpen: true }),
  ]);

  const counts: Record<string, number> = {};
  for (const c of channels) counts[c.status] = (counts[c.status] || 0) + 1;
  const funnel = CHANNEL_STATUSES.map((status) => ({
    status,
    count: counts[status] || 0,
  }));

  const engaged =
    (counts.contacted || 0) +
    (counts.replied || 0) +
    (counts.in_talks || 0) +
    (counts.won || 0) +
    (counts.not_interested || 0);
  const responded =
    (counts.replied || 0) + (counts.in_talks || 0) + (counts.won || 0);
  const won = counts.won || 0;

  const nicheCounts: Record<string, number> = {};
  for (const c of channels) {
    const n = (c.niche || "").trim();
    if (n) nicheCounts[n] = (nicheCounts[n] || 0) + 1;
  }
  const niches = Object.entries(nicheCounts)
    .map(([niche, count]) => ({ niche, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const today = todayStr();
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && t.due_date < today
  ).length;

  return {
    total: channels.length,
    withEmail: channels.filter((c) => c.email).length,
    funnel,
    engaged,
    responded,
    won,
    responseRate: engaged > 0 ? responded / engaged : 0,
    winRate: engaged > 0 ? won / engaged : 0,
    niches,
    recentActivities,
    openTasks,
    overdueTasks,
  };
}

/** RFC-4180-ish CSV row escaping. */
function csvField(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function creatorsCsv(projectId: string): Promise<string> {
  const channels = await listChannels(projectId);
  const header = [
    "title",
    "youtube_id",
    "subscribers",
    "videos",
    "views",
    "country",
    "niche",
    "status",
    "email",
    "notes",
    "saved_at",
  ];
  const lines = [header.join(",")];
  for (const c of channels) {
    lines.push(
      [
        c.title,
        c.id,
        c.subscriber_count,
        c.video_count,
        c.view_count,
        c.country,
        c.niche,
        c.status,
        c.email,
        c.notes,
        c.saved_at,
      ]
        .map(csvField)
        .join(",")
    );
  }
  return lines.join("\n");
}
