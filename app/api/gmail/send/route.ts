import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { sendAsUser } from "@/lib/gmail";
import { getChannelRow, updateChannel } from "@/lib/db";
import { logActivity } from "@/lib/activities";

export async function POST(req: NextRequest) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;

  const { to, subject, body, ytId } = await req.json().catch(() => ({}));
  if (!to || !subject || !body) {
    return NextResponse.json(
      { error: "to, subject and body are required" },
      { status: 400 }
    );
  }

  try {
    const from = await sendAsUser(
      guard.session.uid,
      String(to),
      String(subject),
      String(body)
    );

    // Log to the creator's timeline + advance status if it's still "to contact".
    if (ytId) {
      const active = await getActiveProject(guard.session.wid);
      if (active) {
        const row = await getChannelRow(active.id, String(ytId));
        if (row && row.status === "to_contact") {
          await updateChannel(active.id, String(ytId), { status: "contacted" });
        }
        await logActivity(
          active.id,
          String(ytId),
          "email",
          `Emailed via Gmail: ${subject}`,
          guard.session.uid
        );
      }
    }
    return NextResponse.json({ ok: true, from });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 400 }
    );
  }
}
