# Creator Scout

A YouTube creator research & outreach app. Discover channels by niche, build a
pipeline of promising creators, and draft personalized outreach messages.

## Features

- **Discover** — search a niche/topic and find channels two ways:
  - _Via videos_ (default): searches videos on the topic and surfaces the
    creators behind them — great for finding active creators whose channel
    name doesn't mention the niche.
  - _Channel name/description_: classic channel search.
  - Filter by subscriber range, region, and how recently they've posted.
- **Saved & Outreach** — a pipeline board for saved channels with per-creator
  status (To contact → Contacted → Replied → In talks → Won / Not interested),
  contact email, and notes. Filter by status or niche.
- **Channel detail** — stats, recent uploads, a deep link to the channel's
  About page (where creators publish business emails), and a message composer
  that fills your templates with the channel's details. Copy to clipboard or
  open in your email client via `mailto:`.
- **Templates** — reusable message templates with `{{placeholders}}`
  (`channel_name`, `channel_url`, `subscribers`, `recent_video_title`,
  `niche`, `my_name`). Ships with two starter templates.
- **Settings** — store your YouTube API key and sender name locally.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Get a **YouTube Data API v3** key from the
   [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
   (enable "YouTube Data API v3", then create an API key). The free tier gives
   10,000 quota units/day.
3. Run it:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000, go to **Settings**, and paste your API key.
   (Alternatively set `YOUTUBE_API_KEY` in your environment.)

## How it stays within YouTube's Terms

Contact emails are published by creators on their channel's About page. This
app links you there rather than scraping emails, and reads only public data
through the official YouTube Data API.

## Data

Everything is stored locally in a SQLite database at `data/app.db` (git-ignored).
No accounts, no external services.

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · better-sqlite3.

## API quota notes

The video-discovery mode uses a `search` call (100 units) plus a batched
`channels` lookup (1 unit). Channel detail pages use a few cheap `channels` /
`playlistItems` calls. With the default 10k/day quota you get roughly ~90
niche searches per day.
