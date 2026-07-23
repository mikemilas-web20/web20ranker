import "server-only";
import { eq } from "drizzle-orm";
import { db, ensureReady } from "./drizzle";
import { gmailAccounts } from "./schema";
import { encrypt, decrypt } from "./crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export function gmailConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function authUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

async function tokenRequest(
  body: Record<string, string>
): Promise<Record<string, string>> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.error_description || json.error || "Google token request failed"
    );
  }
  return json;
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ refresh_token?: string; access_token: string }> {
  return tokenRequest({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }) as Promise<{ refresh_token?: string; access_token: string }>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    grant_type: "refresh_token",
  });
  return json.access_token;
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  return json.email || "";
}

/* ------------------------------ token store ------------------------------ */

export async function saveGmailAccount(
  userId: string,
  email: string,
  refreshToken: string
): Promise<void> {
  await ensureReady();
  const enc = encrypt(refreshToken);
  await db
    .insert(gmailAccounts)
    .values({ userId, email, refreshToken: enc })
    .onDuplicateKeyUpdate({ set: { email, refreshToken: enc } });
}

export async function getGmailAccount(
  userId: string
): Promise<{ email: string; refreshToken: string } | null> {
  await ensureReady();
  const rows = await db
    .select()
    .from(gmailAccounts)
    .where(eq(gmailAccounts.userId, userId))
    .limit(1);
  if (!rows[0]) return null;
  return { email: rows[0].email, refreshToken: decrypt(rows[0].refreshToken) };
}

export async function deleteGmailAccount(userId: string): Promise<void> {
  await ensureReady();
  await db.delete(gmailAccounts).where(eq(gmailAccounts.userId, userId));
}

/* -------------------------------- sending -------------------------------- */

function encodeHeader(s: string): string {
  // RFC 2047 encode so unicode subjects don't break the header.
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

function toBase64Url(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmail(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: toBase64Url(mime) }),
    }
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message || `Gmail send failed (${res.status})`);
  }
}

/** Send as the given user's connected Gmail. Returns the sending address. */
export async function sendAsUser(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const account = await getGmailAccount(userId);
  if (!account) throw new Error("No Gmail account connected.");
  const accessToken = await refreshAccessToken(account.refreshToken);
  await sendGmail(accessToken, account.email, to, subject, body);
  return account.email;
}
