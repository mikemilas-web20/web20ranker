/** Client-safe pipeline status constants (no server-only imports). */
export const CHANNEL_STATUSES = [
  "to_contact",
  "contacted",
  "replied",
  "in_talks",
  "won",
  "not_interested",
] as const;

export type ChannelStatus = (typeof CHANNEL_STATUSES)[number];
