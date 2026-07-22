import { NextRequest, NextResponse } from "next/server";
import { getValidInvite } from "@/lib/accounts";

// Public: lets an invited person see which workspace/email a token is for.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ invite: null });
  const invite = await getValidInvite(token);
  if (!invite) return NextResponse.json({ invite: null });
  return NextResponse.json({
    invite: { email: invite.email, workspaceName: invite.workspaceName },
  });
}
