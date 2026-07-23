"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  {
    href: "/projects",
    label: "Projects",
    match: (p: string) => p.startsWith("/projects"),
  },
  { href: "/", label: "Discover", match: (p: string) => p === "/" },
  {
    href: "/saved",
    label: "Pipeline",
    match: (p: string) => p.startsWith("/saved") || p.startsWith("/channel"),
  },
  {
    href: "/tasks",
    label: "Tasks",
    match: (p: string) => p.startsWith("/tasks"),
  },
  {
    href: "/templates",
    label: "Templates",
    match: (p: string) => p.startsWith("/templates"),
  },
  {
    href: "/team",
    label: "Team",
    match: (p: string) => p.startsWith("/team"),
  },
  {
    href: "/settings",
    label: "Settings",
    match: (p: string) => p.startsWith("/settings"),
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 text-sm border",
              active
                ? "bg-surface-2 border-line text-ink"
                : "border-transparent text-ink-dim"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
