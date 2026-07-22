import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { users, workspaces, workspaceMembers, invites } from "./schema";
import { genId, genToken } from "./ids";
import { hashPassword, verifyPassword } from "./password";
import type { SessionUser } from "./jwt";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function authenticate(
  email: string,
  password: string
): Promise<SessionUser | null> {
  await ensureReady();
  const normalized = email.trim().toLowerCase();
  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  const user = found[0];
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;

  const membership = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);
  if (membership.length === 0) return null;

  return {
    uid: user.id,
    wid: membership[0].workspaceId,
    role: membership[0].role,
    email: user.email,
    name: user.name ?? "",
  };
}

export async function getWorkspace(id: string) {
  await ensureReady();
  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export interface MemberRow {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function listMembers(workspaceId: string): Promise<MemberRow[]> {
  await ensureReady();
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));
  return rows.map((r) => ({ ...r, name: r.name ?? "" }));
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: Date;
}

export async function listPendingInvites(
  workspaceId: string
): Promise<PendingInvite[]> {
  await ensureReady();
  const rows = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      token: invites.token,
      expiresAt: invites.expiresAt,
    })
    .from(invites)
    .where(
      and(eq(invites.workspaceId, workspaceId), isNull(invites.acceptedAt))
    );
  return rows;
}

export async function createInvite(
  workspaceId: string,
  invitedBy: string,
  email: string,
  role: "member" | "owner" = "member"
): Promise<string> {
  await ensureReady();
  const token = genToken();
  await db.insert(invites).values({
    id: genId(),
    workspaceId,
    email: email.trim().toLowerCase(),
    role,
    token,
    invitedBy,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });
  return token;
}

export async function revokeInvite(workspaceId: string, id: string) {
  await ensureReady();
  await db
    .delete(invites)
    .where(and(eq(invites.workspaceId, workspaceId), eq(invites.id, id)));
}

export interface ValidInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  workspaceName: string;
}

export async function getValidInvite(
  token: string
): Promise<ValidInvite | null> {
  await ensureReady();
  const rows = await db
    .select({
      id: invites.id,
      workspaceId: invites.workspaceId,
      email: invites.email,
      role: invites.role,
      workspaceName: workspaces.name,
    })
    .from(invites)
    .innerJoin(workspaces, eq(workspaces.id, invites.workspaceId))
    .where(
      and(
        eq(invites.token, token),
        isNull(invites.acceptedAt),
        gt(invites.expiresAt, new Date())
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function acceptInvite(
  token: string,
  name: string,
  password: string
): Promise<SessionUser> {
  await ensureReady();
  const invite = await getValidInvite(token);
  if (!invite) throw new Error("This invite is invalid or has expired.");

  // Reuse an existing user with this email, otherwise create one.
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  let userId: string;
  let displayName: string;
  if (existing[0]) {
    userId = existing[0].id;
    displayName = existing[0].name ?? "";
  } else {
    userId = genId();
    displayName = name.trim() || invite.email.split("@")[0];
    await db.insert(users).values({
      id: userId,
      email: invite.email,
      passwordHash: await hashPassword(password),
      name: displayName,
    });
  }

  await db
    .insert(workspaceMembers)
    .values({ workspaceId: invite.workspaceId, userId, role: invite.role })
    .onDuplicateKeyUpdate({ set: { role: invite.role } });

  await db
    .update(invites)
    .set({ acceptedAt: new Date() })
    .where(eq(invites.id, invite.id));

  return {
    uid: userId,
    wid: invite.workspaceId,
    role: invite.role,
    email: invite.email,
    name: displayName,
  };
}

export async function removeMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  await ensureReady();
  const ws = await getWorkspace(workspaceId);
  if (ws && ws.ownerId === userId) return false; // never remove the owner
  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    );
  return true;
}
