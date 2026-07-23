import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiauth";
import { gmailConfigured, getGmailAccount } from "@/lib/gmail";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const account = await getGmailAccount(guard.session.uid);
  return NextResponse.json({
    configured: gmailConfigured(),
    connected: Boolean(account),
    email: account?.email ?? null,
  });
}
