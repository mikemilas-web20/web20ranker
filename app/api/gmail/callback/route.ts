import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCode, getUserEmail, saveGmailAccount } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const state = sp.get("state");
  const cookieState = req.cookies.get("gmail_oauth_state")?.value;

  const settings = (q: string) =>
    NextResponse.redirect(new URL(`/settings?gmail=${q}`, req.url));

  if (sp.get("error")) return settings("denied");
  if (!code || !state || state !== cookieState) return settings("badstate");

  try {
    const base = process.env.APP_URL || req.nextUrl.origin;
    const redirectUri = `${base}/api/gmail/callback`;
    const tokens = await exchangeCode(code, redirectUri);
    if (!tokens.refresh_token) {
      // No refresh token means Google didn't re-consent; ask user to retry.
      return settings("norefresh");
    }
    const email = await getUserEmail(tokens.access_token);
    await saveGmailAccount(session.uid, email || "your Gmail", tokens.refresh_token);
    const res = settings("connected");
    res.cookies.delete("gmail_oauth_state");
    return res;
  } catch {
    return settings("error");
  }
}
