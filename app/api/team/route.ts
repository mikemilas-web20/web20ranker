import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { listMembers, listPendingInvites, getWorkspace } from "@/lib/accounts";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { wid, role, uid } = guard.session;

  const [members, workspace] = await Promise.all([
    listMembers(wid),
    getWorkspace(wid),
  ]);
  const invites = role === "owner" ? await listPendingInvites(wid) : [];

  return NextResponse.json({
    workspace: { id: wid, name: workspace?.name ?? "Workspace" },
    role,
    currentUserId: uid,
    ownerId: workspace?.ownerId ?? "",
    members,
    invites,
  });
}
