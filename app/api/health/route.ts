import { NextResponse } from "next/server";
import { pingDb } from "@/lib/drizzle";

/**
 * Public diagnostic — reports whether required config is present and whether
 * the database is reachable. Reveals only booleans and the DB error *code*
 * (e.g. ER_ACCESS_DENIED_ERROR) — never secret values. The full DB error
 * message is included only in non-production.
 */
export async function GET() {
  const env = {
    // per-variable presence, so a missing one is obvious
    DATABASE_HOST: Boolean(process.env.DATABASE_HOST),
    DATABASE_PORT: Boolean(process.env.DATABASE_PORT),
    DATABASE_NAME: Boolean(process.env.DATABASE_NAME),
    DATABASE_USER: Boolean(process.env.DATABASE_USER),
    DATABASE_PASSWORD: Boolean(process.env.DATABASE_PASSWORD),
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    OWNER_EMAIL: Boolean(process.env.OWNER_EMAIL),
    OWNER_PASSWORD: Boolean(process.env.OWNER_PASSWORD),
  };

  let dbReachable = false;
  let dbErrorCode: string | null = null;
  let dbError: string | null = null;
  let dbDetail: string | null = null;
  try {
    await pingDb();
    dbReachable = true;
  } catch (e) {
    const err = e as { code?: string; message?: string; sqlMessage?: string };
    dbErrorCode = err.code ?? "UNKNOWN";
    dbError =
      process.env.NODE_ENV === "production"
        ? null
        : (err.message ?? String(e));
    // For access-denied, surface the host MySQL saw + whether a password was
    // sent — with the username masked, so it's safe on a public endpoint.
    const m = /Access denied for user '[^']*'@'([^']*)' \(using password: (YES|NO)\)/.exec(
      err.sqlMessage ?? err.message ?? ""
    );
    if (m) {
      dbDetail = `MySQL saw the connection from host '${m[1]}', using password: ${m[2]}`;
    }
  }

  const ok = dbReachable && env.AUTH_SECRET;
  return NextResponse.json(
    {
      ok,
      env,
      database: {
        reachable: dbReachable,
        code: dbErrorCode,
        detail: dbDetail,
        error: dbError,
      },
      hint: HINTS[dbErrorCode ?? ""] ?? undefined,
    },
    { status: ok ? 200 : 503 }
  );
}

const HINTS: Record<string, string> = {
  ECONNREFUSED:
    "Nothing is listening at DATABASE_HOST:DATABASE_PORT. On Hostinger the host is usually 'localhost' and port 3306.",
  ENOTFOUND: "DATABASE_HOST is not a resolvable hostname. Check for a typo.",
  ETIMEDOUT:
    "The database host didn't respond — wrong host or blocked by a firewall.",
  ER_ACCESS_DENIED_ERROR:
    "DATABASE_USER / DATABASE_PASSWORD are wrong, or the user isn't allowed to connect from this host.",
  ER_BAD_DB_ERROR:
    "DATABASE_NAME doesn't exist. On Hostinger the name is prefixed, e.g. u123456_scout.",
  PROTOCOL_CONNECTION_LOST: "The database closed the connection unexpectedly.",
};
