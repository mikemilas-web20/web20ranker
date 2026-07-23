"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import ProjectSwitcher, { ProjectLite } from "./ProjectSwitcher";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p: string) => p.startsWith("/dashboard"),
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
  },
  {
    href: "/projects",
    label: "Projects",
    match: (p: string) => p.startsWith("/projects"),
    icon: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>
    ),
  },
  {
    href: "/",
    label: "Discover",
    match: (p: string) => p === "/",
    icon: (
      <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" />
    ),
  },
  {
    href: "/saved",
    label: "Pipeline",
    match: (p: string) => p.startsWith("/saved") || p.startsWith("/channel"),
    icon: (
      <>
        <rect x="3" y="4" width="5" height="16" rx="1" />
        <rect x="10" y="4" width="5" height="11" rx="1" />
        <rect x="17" y="4" width="4" height="7" rx="1" />
      </>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    match: (p: string) => p.startsWith("/tasks"),
    icon: (
      <>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </>
    ),
  },
  {
    href: "/templates",
    label: "Templates",
    match: (p: string) => p.startsWith("/templates"),
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <path d="M8 9h8M8 13h6" />
      </>
    ),
  },
  {
    href: "/team",
    label: "Team",
    match: (p: string) => p.startsWith("/team"),
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M16 5.5a3 3 0 0 1 0 5.4M21 20a6 6 0 0 0-4-5.6" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    match: (p: string) => p.startsWith("/settings"),
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
      </>
    ),
  },
];

interface SidebarUser {
  name: string;
  email: string;
  role: string;
  workspace: string;
}

export default function Sidebar({
  user,
  projects,
  activeId,
}: {
  user: SidebarUser;
  projects: ProjectLite[];
  activeId: string | null;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
        <span className="w-9 h-9 grid place-items-center bg-accent text-accent-ink font-black text-lg shadow-block-sm">
          ◐
        </span>
        <div className="leading-tight">
          <div className="font-bold tracking-tight text-ink">Creator Scout</div>
          <div className="label !text-[9px] !tracking-[0.2em]">Outreach console</div>
        </div>
      </div>

      <div className="p-3 border-b border-line">
        <ProjectSwitcher projects={projects} activeId={activeId} />
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm border border-transparent transition-colors",
                active
                  ? "bg-surface-2 border-line text-ink"
                  : "text-ink-dim hover:text-ink hover:bg-surface-2/60"
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={active ? "text-accent" : ""}
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <div className="border border-line bg-surface-2 p-3">
          <div className="label mb-1">Workspace</div>
          <div className="text-sm text-ink truncate">{user.workspace}</div>
          <div className="label !tracking-[0.1em] mt-1 text-ink-dim/70">
            {user.role === "owner" ? "owner" : "member"} · invite-only
          </div>
        </div>
      </div>
    </aside>
  );
}
