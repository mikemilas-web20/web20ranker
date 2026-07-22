# Creator Scout

A closed, invite-only SaaS for **YouTube creator research & outreach**. Members
sign into a workspace, discover channels by niche, build a shared pipeline of
promising creators, and draft personalized outreach.

## Features

- **Accounts & workspaces** — email/password login, team workspaces with
  **Owner** and **Member** roles, and invite-only membership (owners generate
  invite links). Everything is scoped to a workspace and shared across its
  members.
- **Discover** — search a niche/topic and find channels two ways:
  - _Via videos_ (default): searches videos on the topic and surfaces the
    creators behind them — great for finding active creators whose channel
    name doesn't mention the niche.
  - _Channel name/description_: classic channel search.
  - Filter by subscriber range, region, and how recently they've posted.
- **Pipeline** — a board for saved channels with per-creator status
  (To contact → Contacted → Replied → In talks → Won / Not interested),
  contact email, and notes. Filter by status or niche.
- **Creator detail** — stats, recent uploads, a deep link to the channel's
  About page (where creators publish business emails), and a message composer
  that fills your templates with the channel's details. Copy or open in your
  email client via `mailto:`.
- **Templates** — reusable messages with `{{placeholders}}`
  (`channel_name`, `channel_url`, `subscribers`, `recent_video_title`,
  `niche`, `my_name`), shared per workspace.
- **Settings** — the workspace's YouTube API key and sender name.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · **MySQL** via Drizzle ORM
and the pure-JS `mysql2` driver (no native compilation — deploys on shared
hosting) · self-hosted auth with `jose` (JWT session cookies) and Node's
built-in `scrypt` for password hashing.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Create a MySQL database** and a user with access to it. On Hostinger:
   hPanel → **Databases → MySQL** → create a database and a user, then add the
   user to the database.
3. **Configure environment** — copy `.env.example` to `.env.local` (local) or
   set the same variables in Hostinger's environment-variables panel:
   - `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USER` /
     `DATABASE_PASSWORD`
   - `AUTH_SECRET` — a long random string
     (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `OWNER_EMAIL` / `OWNER_PASSWORD` — see **Admin login** below
   - `OWNER_NAME`, `OWNER_WORKSPACE` (optional)
4. **Run it:**
   ```bash
   npm run dev
   ```
   The database schema is created automatically on first run (no migration
   step needed).

## Admin login

There's no public signup. On first run, the app reads `OWNER_EMAIL` and
`OWNER_PASSWORD` and, if no account exists for that email, creates the **Owner
account + its workspace**. Sign in at `/login` with those credentials. Everyone
else joins by invite (Team page → create invite → share the link). Change the
owner password after first login; the env values then act as a recovery path.

## YouTube API key

Get a free **YouTube Data API v3** key from the
[Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
(enable the API, create an API key), then add it in **Settings**. Each
workspace uses its own key. The free tier is 10,000 quota units/day (~90 niche
searches). You can also set a server-wide fallback via `YOUTUBE_API_KEY`.

## How it stays within YouTube's Terms

Contact emails are published by creators on their channel's About page. This
app links you there rather than scraping, and reads only public data through
the official YouTube Data API.
