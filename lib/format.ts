export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export const STATUS_LABELS: Record<string, string> = {
  to_contact: "To contact",
  contacted: "Contacted",
  replied: "Replied",
  in_talks: "In talks",
  won: "Won",
  not_interested: "Not interested",
};

/** Semantic tone per pipeline status, mapped to design tokens in Badge. */
export const STATUS_TONE: Record<string, string> = {
  to_contact: "neutral",
  contacted: "info",
  replied: "warn",
  in_talks: "warn",
  won: "good",
  not_interested: "crit",
};

export function channelUrl(id: string, customUrl?: string): string {
  return customUrl
    ? `https://www.youtube.com/${customUrl}`
    : `https://www.youtube.com/channel/${id}`;
}

export function fillTemplate(
  text: string,
  vars: Record<string, string>
): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name) =>
    name in vars ? vars[name] : m
  );
}
