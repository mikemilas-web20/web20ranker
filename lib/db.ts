import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS channels (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL,
      description      TEXT DEFAULT '',
      thumbnail        TEXT DEFAULT '',
      custom_url       TEXT DEFAULT '',
      country          TEXT DEFAULT '',
      subscriber_count INTEGER DEFAULT 0,
      video_count      INTEGER DEFAULT 0,
      view_count       INTEGER DEFAULT 0,
      niche            TEXT DEFAULT '',
      status           TEXT NOT NULL DEFAULT 'to_contact',
      email            TEXT DEFAULT '',
      notes            TEXT DEFAULT '',
      saved_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS templates (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      subject    TEXT DEFAULT '',
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const count = db.prepare("SELECT COUNT(*) AS n FROM templates").get() as { n: number };
  if (count.n === 0) seedTemplates(db);
}

function seedTemplates(db: Database.Database) {
  const insert = db.prepare(
    "INSERT INTO templates (name, subject, body) VALUES (?, ?, ?)"
  );
  insert.run(
    "Collaboration intro",
    "Collaboration idea for {{channel_name}}",
    `Hi {{channel_name}} team,

I've been following your channel ({{channel_url}}) and really enjoyed "{{recent_video_title}}". With {{subscribers}} subscribers in the {{niche}} space, your audience is exactly who we'd love to reach.

I'd love to explore a collaboration — whether that's a sponsored segment, a product review, or something more creative.

Would you be open to a quick chat?

Best,
{{my_name}}`
  );
  insert.run(
    "Sponsorship offer",
    "Sponsorship opportunity for {{channel_name}}",
    `Hey {{channel_name}},

I work with brands in the {{niche}} niche and think your channel would be a great fit for a paid sponsorship.

If you're taking on sponsors, I'd love to share the details — rates, deliverables, and timeline are all flexible.

Thanks,
{{my_name}}`
  );
}

export const CHANNEL_STATUSES = [
  "to_contact",
  "contacted",
  "replied",
  "in_talks",
  "won",
  "not_interested",
] as const;

export type ChannelStatus = (typeof CHANNEL_STATUSES)[number];

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}
