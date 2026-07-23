import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { authUrl, gmailConfigured } from "@/lib/gmail";
import { genToken } from "@/lib/ids";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  if (!gmailConfigured()) {
    return NextResponse.redirect(
      new URL("/settings?gmail=notconfigured", req.url)
    );
  }

  const base = process.env.APP_URL || req.nextUrl.origin;
  const redirectUri = `${base}/api/gmail/callback`;
  const state = genToken();

  const res = NextResponse.redirect(authUrl(redirectUri, state));
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
