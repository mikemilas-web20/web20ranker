"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/saved", label: "Saved & Outreach" },
  { href: "/templates", label: "Templates" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-6 h-14">
        <Link href="/" className="font-semibold text-white tracking-tight">
          <span className="text-red-500">▶</span> Creator Scout
        </Link>
        <nav className="flex gap-1 text-sm">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-slate-700/70 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
