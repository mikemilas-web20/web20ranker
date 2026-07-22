import { NextResponse } from "next/server";
import { pingDb } from "@/lib/drizzle";

/**
 * Public diagnostic — reports whether required config is present and whether
 * the database is reachable. Reveals only booleans (never secret values); the
 * detailed DB error is included in non-production for debugging.
 */
export async function GET() {
  const env = {
    databaseConfigured: Boolean(process.env.DATABASE_HOST),
    authSecretSet: Boolean(process.env.AUTH_SECRET),
    ownerSeedSet: Boolean(
      process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD
    ),
  };

  let dbReachable = false;
  let dbError: string | null = null;
  try {
    await pingDb();
    dbReachable = true;
  } catch (e) {
    dbError =
      process.env.NODE_ENV === "production"
        ? "Could not connect to the database."
        : e instanceof Error
          ? e.message
          : String(e);
  }

  const ok = dbReachable && env.authSecretSet;
  return NextResponse.json(
    { ok, env, database: { reachable: dbReachable, error: dbError } },
    { status: ok ? 200 : 503 }
  );
}
