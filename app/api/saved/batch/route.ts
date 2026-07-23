import { NextRequest, NextResponse } from "next/server";
import { requireApiSession, resolveApiKey } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { updateChannel, CHANNEL_STATUSES } from "@/lib/db";
import { enrichCreator } from "@/lib/contacts";
import { logActivity } from "@/lib/activities";
import { STATUS_LABELS } from "@/lib/format";
import { YouTubeApiError } from "@/lib/youtube";

const MAX_BATCH = 40;

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.slice(0, MAX_BATCH).map(String)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No creators selected" }, { status: 400 });
  }

  if (action === "status") {
    const status = String(body.status || "");
    if (!CHANNEL_STATUSES.includes(status as never)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    for (const id of ids) {
      const ok = await updateChannel(active.id, id, { status });
      if (ok) {
        await logActivity(
          active.id,
          id,
          "status",
          `Status set to ${STATUS_LABELS[status] ?? status}`,
          guard.session.uid
        );
      }
    }
    return NextResponse.json({ ok: true, updated: ids.length });
  }

  if (action === "enrich") {
    try {
      const apiKey = await resolveApiKey(guard.session.wid);
      let totalAdded = 0;
      for (const id of ids) {
        const r = await enrichCreator(active.id, id, apiKey!);
        totalAdded += r.added;
      }
      return NextResponse.json({ ok: true, enriched: ids.length, added: totalAdded });
    } catch (e) {
      if (e instanceof YouTubeApiError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
