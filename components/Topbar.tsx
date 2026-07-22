"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const TITLES: { test: (p: string) => boolean; label: string }[] = [
  { test: (p) => p === "/", label: "Discover" },
  { test: (p) => p.startsWith("/channel"), label: "Creator" },
  { test: (p) => p.startsWith("/saved"), label: "Pipeline" },
  { test: (p) => p.startsWith("/templates"), label: "Templates" },
  { test: (p) => p.startsWith("/settings"), label: "Settings" },
];

export default function Topbar() {
  const pathname = usePathname();
  const title = TITLES.find((t) => t.test(pathname))?.label ?? "Creator Scout";

  return (
    <header className="h-16 shrink-0 border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-20 flex items-center gap-4 px-5">
      {/* mobile brand */}
      <Link href="/" className="md:hidden flex items-center gap-2">
        <span className="w-8 h-8 grid place-items-center bg-accent text-accent-ink font-black shadow-block-sm">
          ◐
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="font-mono text-xs tracking-[0.16em] uppercase text-ink-dim">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.14em] uppercase text-ink border border-line-strong px-2.5 py-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse motion-reduce:animate-none" />
          On air
        </span>
        <ThemeToggle />
        <div className="w-9 h-9 grid place-items-center bg-surface-2 border border-line-strong text-ink font-bold text-sm">
          A
        </div>
      </div>
    </header>
  );
}
