import { SignJWT, jwtVerify } from "jose";

export interface SessionUser {
  uid: string; // user id
  wid: string; // current workspace id
  role: string; // role in that workspace
  email: string;
  name: string;
}

export const SESSION_COOKIE = "cs_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set.");
  return new TextEncoder().encode(s);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.uid === "string" &&
      typeof payload.wid === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        uid: payload.uid,
        wid: payload.wid,
        role: String(payload.role ?? "member"),
        email: payload.email,
        name: String(payload.name ?? ""),
      };
    }
    return null;
  } catch {
    return null;
  }
}
