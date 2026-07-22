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

export const STATUS_COLORS: Record<string, string> = {
  to_contact: "bg-slate-600/40 text-slate-200",
  contacted: "bg-blue-600/30 text-blue-200",
  replied: "bg-violet-600/30 text-violet-200",
  in_talks: "bg-amber-600/30 text-amber-200",
  won: "bg-emerald-600/30 text-emerald-200",
  not_interested: "bg-rose-600/30 text-rose-200",
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
