import {
  mysqlTable,
  varchar,
  text,
  int,
  bigint,
  datetime,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 24 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).default(""),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workspaces = mysqlTable("workspaces", {
  id: varchar("id", { length: 24 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerId: varchar("owner_id", { length: 24 }).notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workspaceMembers = mysqlTable(
  "workspace_members",
  {
    workspaceId: varchar("workspace_id", { length: 24 }).notNull(),
    userId: varchar("user_id", { length: 24 }).notNull(),
    role: varchar("role", { length: 16 }).notNull().default("member"),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]
);

export const invites = mysqlTable("invites", {
  id: varchar("id", { length: 24 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 24 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 16 }).notNull().default("member"),
  token: varchar("token", { length: 48 }).notNull().unique(),
  invitedBy: varchar("invited_by", { length: 24 }).notNull(),
  acceptedAt: datetime("accepted_at"),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 24 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 24 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const channels = mysqlTable(
  "channels",
  {
    projectId: varchar("project_id", { length: 24 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 24 }).notNull(),
    ytId: varchar("yt_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    thumbnail: varchar("thumbnail", { length: 512 }).default(""),
    customUrl: varchar("custom_url", { length: 255 }).default(""),
    country: varchar("country", { length: 8 }).default(""),
    subscriberCount: bigint("subscriber_count", { mode: "number" }).default(0),
    videoCount: int("video_count").default(0),
    viewCount: bigint("view_count", { mode: "number" }).default(0),
    niche: varchar("niche", { length: 160 }).default(""),
    status: varchar("status", { length: 24 }).notNull().default("to_contact"),
    email: varchar("email", { length: 255 }).default(""),
    notes: text("notes"),
    savedAt: datetime("saved_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.ytId] })]
);

export const templates = mysqlTable("templates", {
  id: int("id").primaryKey().autoincrement(),
  workspaceId: varchar("workspace_id", { length: 24 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  subject: varchar("subject", { length: 255 }).default(""),
  body: text("body").notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const settings = mysqlTable(
  "settings",
  {
    workspaceId: varchar("workspace_id", { length: 24 }).notNull(),
    key: varchar("key", { length: 64 }).notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.key] })]
);

export const searchHistory = mysqlTable("search_history", {
  id: varchar("id", { length: 24 }).primaryKey(),
  projectId: varchar("project_id", { length: 24 }).notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  mode: varchar("mode", { length: 16 }).notNull().default("videos"),
  filters: text("filters"), // JSON
  resultCount: int("result_count").default(0),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const savedSearches = mysqlTable("saved_searches", {
  id: varchar("id", { length: 24 }).primaryKey(),
  projectId: varchar("project_id", { length: 24 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  mode: varchar("mode", { length: 16 }).notNull().default("videos"),
  filters: text("filters"), // JSON
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const activities = mysqlTable("activities", {
  id: varchar("id", { length: 24 }).primaryKey(),
  projectId: varchar("project_id", { length: 24 }).notNull(),
  ytId: varchar("yt_id", { length: 64 }).notNull(),
  userId: varchar("user_id", { length: 24 }).default(""),
  type: varchar("type", { length: 24 }).notNull().default("note"),
  body: text("body"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 24 }).primaryKey(),
  projectId: varchar("project_id", { length: 24 }).notNull(),
  ytId: varchar("yt_id", { length: 64 }).default(""),
  channelTitle: varchar("channel_title", { length: 255 }).default(""),
  title: varchar("title", { length: 255 }).notNull(),
  dueDate: varchar("due_date", { length: 10 }).default(""), // YYYY-MM-DD
  done: int("done").notNull().default(0),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
