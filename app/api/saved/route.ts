import { NextRequest, NextResponse } from "next/server";
import { listChannels, upsertChannel } from "@/lib/db";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { contactCountsByChannel } from "@/lib/contacts";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) return NextResponse.json({ channels: [], project: null });

  const [channels, counts] = await Promise.all([
    listChannels(active.id),
    contactCountsByChannel(active.id),
  ]);
  return NextResponse.json({
    channels: channels.map((c) => ({
      ...c,
      contact_count: counts[c.id] || 0,
    })),
    project: active,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid } = guard.session;

  const active = await getActiveProject(wid);
  if (!active) {
    return NextResponse.json(
      { error: "No active project. Create a project first." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { id, title } = body;
  if (!id || !title) {
    return NextResponse.json(
      { error: "id and title are required" },
      { status: 400 }
    );
  }
  await upsertChannel(active.id, wid, {
    id,
    title,
    description: body.description,
    thumbnail: body.thumbnail,
    customUrl: body.customUrl,
    country: body.country,
    subscriberCount: body.subscriberCount,
    videoCount: body.videoCount,
    viewCount: body.viewCount,
    niche: body.niche,
  });
  return NextResponse.json({ ok: true });
}
