import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { getWorkspace } from "@/lib/accounts";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { uid, wid, role, email, name } = guard.session;
  const workspace = await getWorkspace(wid);
  return NextResponse.json({
    user: { id: uid, email, name, role },
    workspace: { id: wid, name: workspace?.name ?? "Workspace" },
  });
}
