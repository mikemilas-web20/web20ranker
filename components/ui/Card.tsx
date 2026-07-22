import { cn } from "@/lib/cn";

export function Card({
  block,
  className,
  ...props
}: { block?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-line p-4",
        block && "shadow-block",
        className
      )}
      {...props}
    />
  );
}
