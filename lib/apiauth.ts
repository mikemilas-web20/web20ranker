import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./session";
import { getSetting } from "./db";

type Guard =
  | { session: SessionUser; response?: undefined }
  | { session?: undefined; response: NextResponse };

/** Returns the session, or a 401 response to return from the route. */
export async function requireApiSession(): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export function requireOwner(session: SessionUser): NextResponse | null {
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Owners only" }, { status: 403 });
  }
  return null;
}

/** Resolve the workspace's YouTube API key (falls back to a server-wide env key). */
export async function resolveApiKey(
  workspaceId: string
): Promise<string | null> {
  const stored = await getSetting(workspaceId, "youtube_api_key");
  return stored || process.env.YOUTUBE_API_KEY || null;
}
