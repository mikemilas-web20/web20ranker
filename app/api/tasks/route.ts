import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { listTasks, createTask } from "@/lib/tasks";

export async function GET(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) return NextResponse.json({ tasks: [] });

  const sp = req.nextUrl.searchParams;
  const ytId = sp.get("channel") ?? undefined;
  const onlyOpen = sp.get("open") === "1";
  return NextResponse.json({
    tasks: await listTasks(active.id, { ytId, onlyOpen }),
    project: active,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: "A task title is required" }, { status: 400 });
  }
  const id = await createTask(active.id, {
    title: String(body.title),
    dueDate: body.dueDate ? String(body.dueDate) : "",
    ytId: body.ytId ? String(body.ytId) : "",
    channelTitle: body.channelTitle ? String(body.channelTitle) : "",
  });
  return NextResponse.json({ ok: true, id });
}
