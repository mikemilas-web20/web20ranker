"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

interface TopbarUser {
  name: string;
  email: string;
  role: string;
  workspace: string;
}

const TITLES: { test: (p: string) => boolean; label: string }[] = [
  { test: (p) => p.startsWith("/dashboard"), label: "Dashboard" },
  { test: (p) => p === "/", label: "Discover" },
  { test: (p) => p.startsWith("/channel"), label: "Creator" },
  { test: (p) => p.startsWith("/saved"), label: "Pipeline" },
  { test: (p) => p.startsWith("/tasks"), label: "Tasks" },
  { test: (p) => p.startsWith("/templates"), label: "Templates" },
  { test: (p) => p.startsWith("/team"), label: "Team" },
  { test: (p) => p.startsWith("/settings"), label: "Settings" },
];

export default function Topbar({
  user,
  activeProject,
}: {
  user: TopbarUser;
  activeProject: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = TITLES.find((t) => t.test(pathname))?.label ?? "Creator Scout";
  // Show the active project alongside the title on project-scoped screens.
  const showProject =
    activeProject &&
    (pathname === "/" ||
      pathname.startsWith("/saved") ||
      pathname.startsWith("/channel"));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <header className="h-16 shrink-0 border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-20 flex items-center gap-4 px-5">
      <Link href="/" className="md:hidden flex items-center gap-2">
        <span className="w-8 h-8 grid place-items-center bg-accent text-accent-ink font-black shadow-block-sm">
          ◐
        </span>
      </Link>

      <h1 className="font-mono text-xs tracking-[0.16em] uppercase text-ink-dim flex items-center gap-2">
        {title}
        {showProject && (
          <>
            <span className="text-line-strong">/</span>
            <span className="text-accent normal-case tracking-normal">
              {activeProject}
            </span>
          </>
        )}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.14em] uppercase text-ink border border-line-strong px-2.5 py-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse motion-reduce:animate-none" />
          On air
        </span>
        <ThemeToggle />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-9 h-9 grid place-items-center bg-surface-2 border border-line-strong text-ink font-bold text-sm hover:border-ink-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Account menu"
          >
            {initial}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 border border-line-strong bg-surface shadow-block z-30">
              <div className="p-3 border-b border-line">
                <div className="text-sm text-ink truncate">
                  {user.name || "Member"}
                </div>
                <div className="font-mono text-[11px] text-ink-dim truncate">
                  {user.email}
                </div>
              </div>
              <Link
                href="/team"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-ink-dim hover:text-ink hover:bg-surface-2"
              >
                Team &amp; invites
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-ink-dim hover:text-ink hover:bg-surface-2"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-crit hover:bg-crit/10 border-t border-line"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
