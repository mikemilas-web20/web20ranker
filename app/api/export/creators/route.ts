import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { creatorsCsv } from "@/lib/dashboard";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ error: "No active project" }, { status: 400 });
  }
  const csv = await creatorsCsv(active.id);
  const safeName = active.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="creators-${safeName}.csv"`,
    },
  });
}
