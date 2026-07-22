import "server-only";
import mysql from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { users, workspaces, workspaceMembers, templates } from "./schema";
import { genId } from "./ids";
import { hashPassword } from "./password";

type Globals = {
  _pool?: mysql.Pool;
  _ready?: Promise<void>;
};
const g = globalThis as unknown as Globals;

function makePool(): mysql.Pool {
  let host = process.env.DATABASE_HOST;
  if (!host) {
    throw new Error(
      "DATABASE_HOST is not set. Configure DATABASE_* environment variables."
    );
  }
  // "localhost" can resolve to IPv6 ::1, which most MySQL grants (localhost /
  // 127.0.0.1) don't cover — causing ER_ACCESS_DENIED. Force IPv4.
  if (host === "localhost") host = "127.0.0.1";
  return mysql.createPool({
    host,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 5,
    charset: "utf8mb4",
  });
}

const pool = g._pool ?? makePool();
if (!g._pool) g._pool = pool;

export const db: MySql2Database<typeof schema> = drizzle(pool, {
  schema,
  mode: "default",
});

// Idempotent DDL — avoids needing a migration step in the deploy pipeline.
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(24) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(120) DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    owner_id VARCHAR(24) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id VARCHAR(24) NOT NULL,
    user_id VARCHAR(24) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'member',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS invites (
    id VARCHAR(24) PRIMARY KEY,
    workspace_id VARCHAR(24) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'member',
    token VARCHAR(48) NOT NULL UNIQUE,
    invited_by VARCHAR(24) NOT NULL,
    accepted_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS channels (
    workspace_id VARCHAR(24) NOT NULL,
    yt_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(512) DEFAULT '',
    custom_url VARCHAR(255) DEFAULT '',
    country VARCHAR(8) DEFAULT '',
    subscriber_count BIGINT DEFAULT 0,
    video_count INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    niche VARCHAR(160) DEFAULT '',
    status VARCHAR(24) NOT NULL DEFAULT 'to_contact',
    email VARCHAR(255) DEFAULT '',
    notes TEXT,
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, yt_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(24) NOT NULL,
    name VARCHAR(160) NOT NULL,
    subject VARCHAR(255) DEFAULT '',
    body TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS settings (
    workspace_id VARCHAR(24) NOT NULL,
    \`key\` VARCHAR(64) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (workspace_id, \`key\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

const STARTER_TEMPLATES = [
  {
    name: "Collaboration intro",
    subject: "Collaboration idea for {{channel_name}}",
    body: `Hi {{channel_name}} team,

I've been following your channel ({{channel_url}}) and really enjoyed "{{recent_video_title}}". With {{subscribers}} subscribers in the {{niche}} space, your audience is exactly who we'd love to reach.

I'd love to explore a collaboration — whether that's a sponsored segment, a product review, or something more creative.

Would you be open to a quick chat?

Best,
{{my_name}}`,
  },
  {
    name: "Sponsorship offer",
    subject: "Sponsorship opportunity for {{channel_name}}",
    body: `Hey {{channel_name}},

I work with brands in the {{niche}} niche and think your channel would be a great fit for a paid sponsorship.

If you're taking on sponsors, I'd love to share the details — rates, deliverables, and timeline are all flexible.

Thanks,
{{my_name}}`,
  },
];

async function migrate() {
  for (const stmt of DDL) {
    await pool.query(stmt);
  }
}

async function seedOwner() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) return; // no seed configured

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) return; // owner already present

  const userId = genId();
  const workspaceId = genId();
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: await hashPassword(password),
    name: process.env.OWNER_NAME?.trim() || "Owner",
  });
  await db.insert(workspaces).values({
    id: workspaceId,
    name: process.env.OWNER_WORKSPACE?.trim() || "My Workspace",
    ownerId: userId,
  });
  await db.insert(workspaceMembers).values({
    workspaceId,
    userId,
    role: "owner",
  });
  // Seed starter templates for the owner workspace.
  for (const t of STARTER_TEMPLATES) {
    await db.insert(templates).values({ workspaceId, ...t });
  }
}

/** Lightweight connectivity check for the health endpoint. */
export async function pingDb(): Promise<void> {
  await pool.query("SELECT 1");
}

/** Runs migrations + owner seed exactly once per process. */
export function ensureReady(): Promise<void> {
  if (!g._ready) {
    g._ready = (async () => {
      await migrate();
      await seedOwner();
    })();
  }
  return g._ready;
}
