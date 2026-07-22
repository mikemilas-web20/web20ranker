"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

export interface ProjectLite {
  id: string;
  name: string;
  count: number;
}

export default function ProjectSwitcher({
  projects,
  activeId,
}: {
  projects: ProjectLite[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  async function switchTo(id: string) {
    setOpen(false);
    if (id === active?.id) return;
    setSwitching(true);
    await fetch("/api/projects/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    router.refresh();
    setSwitching(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="w-full flex items-center gap-2 border border-line bg-surface-2 px-3 py-2 text-left hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="w-6 h-6 shrink-0 grid place-items-center bg-accent/15 text-accent text-[11px] font-bold border border-accent/30">
          {(active?.name ?? "?").charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="label !text-[9px] block">Project</span>
          <span className="text-sm text-ink truncate block">
            {switching ? "Switching…" : (active?.name ?? "No project")}
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink-dim shrink-0"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 border border-line-strong bg-surface shadow-block z-40 max-h-72 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => switchTo(p.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2",
                p.id === active?.id ? "text-ink" : "text-ink-dim"
              )}
            >
              <span className="flex-1 truncate">{p.name}</span>
              <span className="font-mono text-[11px] text-ink-dim">
                {p.count}
              </span>
              {p.id === active?.id && (
                <span className="text-accent text-xs">●</span>
              )}
            </button>
          ))}
          <Link
            href="/projects"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-accent hover:bg-surface-2 border-t border-line"
          >
            Manage projects →
          </Link>
        </div>
      )}
    </div>
  );
}
