import { cn } from "@/lib/cn";
import Link from "next/link";

type Variant = "primary" | "default" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-medium border cursor-pointer transition-transform transition-shadow duration-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-default select-none";

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink border-accent shadow-block-sm hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px",
  default:
    "bg-surface-2 text-ink border-line-strong hover:border-ink-dim",
  ghost:
    "bg-transparent text-ink-dim border-line hover:text-ink hover:border-line-strong",
  danger:
    "bg-transparent text-crit border-crit/40 hover:border-crit hover:bg-crit/10",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "default",
  size = "md",
  className,
  href,
  external,
  ...props
}: CommonProps & {
  href: string;
  external?: boolean;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls = cn(base, sizes[size], variants[variant], className);
  if (external) {
    return <a href={href} className={cls} {...props} />;
  }
  return <Link href={href} className={cls} {...props} />;
}
