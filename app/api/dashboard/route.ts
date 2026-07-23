import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getActiveProject } from "@/lib/projects";
import { getDashboardStats } from "@/lib/dashboard";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const active = await getActiveProject(guard.session.wid);
  if (!active) {
    return NextResponse.json({ project: null, stats: null });
  }
  const stats = await getDashboardStats(active.id);
  return NextResponse.json({ project: active, stats });
}
