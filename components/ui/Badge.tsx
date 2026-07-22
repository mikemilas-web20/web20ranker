import { cn } from "@/lib/cn";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/format";

const toneClasses: Record<string, string> = {
  neutral: "text-ink-dim border-line-strong before:bg-ink-dim",
  info: "text-info border-info/40 before:bg-info",
  warn: "text-warn border-warn/40 before:bg-warn",
  good: "text-good border-good/40 before:bg-good",
  crit: "text-crit border-crit/40 before:bg-crit",
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "font-mono inline-flex items-center gap-1.5 text-[11px] tracking-wide uppercase px-2.5 py-1 border before:content-[''] before:w-[7px] before:h-[7px]",
        toneClasses[tone],
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] px-2 py-0.5 bg-surface-2 border border-line text-ink-dim before:content-['#'] before:text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
