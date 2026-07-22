import { randomBytes } from "crypto";

/** 24-char hex id for users, workspaces, invites. */
export const genId = (): string => randomBytes(12).toString("hex");

/** 48-char hex token for invite links. */
export const genToken = (): string => randomBytes(24).toString("hex");
