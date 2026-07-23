import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { sendAsUser } from "@/lib/gmail";
import {
  getChannelRow,
  updateChannel,
  listTemplates,
  getSetting,
} from "@/lib/db";
import { logActivity } from "@/lib/activities";
import { fillTemplate, channelUrl, formatCount } from "@/lib/format";

const MAX_BATCH = 40;

interface Result {
  id: string;
  title: string;
  status: "sent" | "skipped" | "failed";
  detail?: string;
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid, uid } = guard.session;

  const active = await getActiveProject(wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.slice(0, MAX_BATCH).map(String)
    : [];
  const templateId = Number(body.templateId);
  if (ids.length === 0 || !templateId) {
    return NextResponse.json(
      { error: "Select creators and a template" },
      { status: 400 }
    );
  }

  const templates = await listTemplates(wid);
  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  const senderName = (await getSetting(wid, "sender_name")) || "";

  const results: Result[] = [];
  for (const id of ids) {
    const row = await getChannelRow(active.id, id);
    if (!row) {
      results.push({ id, title: id, status: "skipped", detail: "not saved" });
      continue;
    }
    if (!row.email) {
      results.push({
        id,
        title: row.title,
        status: "skipped",
        detail: "no email",
      });
      continue;
    }
    const vars: Record<string, string> = {
      channel_name: row.title,
      channel_url: channelUrl(row.id, row.custom_url),
      subscribers: formatCount(row.subscriber_count),
      recent_video_title: "your recent video",
      niche: row.niche || "",
      my_name: senderName || "[your name]",
    };
    const subject = fillTemplate(template.subject, vars);
    const message = fillTemplate(template.body, vars);
    try {
      await sendAsUser(uid, row.email, subject, message);
      if (row.status === "to_contact") {
        await updateChannel(active.id, id, { status: "contacted" });
      }
      await logActivity(
        active.id,
        id,
        "email",
        `Emailed via Gmail: ${subject}`,
        uid
      );
      results.push({ id, title: row.title, status: "sent" });
    } catch (e) {
      results.push({
        id,
        title: row.title,
        status: "failed",
        detail: e instanceof Error ? e.message : "send error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.status === "sent").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
