import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { deleteGmailAccount } from "@/lib/gmail";

export async function POST() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  await deleteGmailAccount(guard.session.uid);
  return NextResponse.json({ ok: true });
}
