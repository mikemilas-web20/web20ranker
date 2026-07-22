"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";

interface Member {
  userId: string;
  email: string;
  name: string;
  role: string;
}
interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}
interface TeamData {
  workspace: { id: string; name: string };
  role: string;
  currentUserId: string;
  ownerId: string;
  members: Member[];
  invites: Invite[];
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const isOwner = data?.role === "owner";

  function inviteUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join/${token}`;
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create invite");
      setInviteEmail("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setInviting(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/team/invite/${id}`, { method: "DELETE" });
    load();
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member from the workspace?")) return;
    const res = await fetch(`/api/team/member/${userId}`, { method: "DELETE" });
    if (res.ok) load();
  }

  function copy(token: string) {
    navigator.clipboard.writeText(inviteUrl(token)).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (loading)
    return <p className="text-ink-dim text-sm py-8 text-center">Loading…</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Team</h1>
        <p className="text-ink-dim text-sm mt-1">
          {data.workspace.name} · {data.members.length} member
          {data.members.length === 1 ? "" : "s"}
          {isOwner ? " · you're the owner" : ""}
        </p>
      </div>

      {isOwner && (
        <Card block className="flex flex-col gap-4">
          <h2 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
            Invite a member
          </h2>
          {error && (
            <div className="border border-crit/50 bg-crit/10 text-ink px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={createInvite} className="flex gap-2 items-end">
            <Field label="Email" className="flex-1">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </Field>
            <Button type="submit" variant="primary" disabled={inviting}>
              {inviting ? "Creating…" : "Create invite"}
            </Button>
          </form>

          {data.invites.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="label">Pending invites</div>
              {data.invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-2 border border-line bg-surface-2 px-3 py-2"
                >
                  <span className="font-mono text-sm text-ink">{inv.email}</span>
                  <span className="label !text-[10px]">
                    expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="default" onClick={() => copy(inv.token)}>
                      {copied === inv.token ? "Copied!" : "Copy link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:!text-crit"
                      onClick={() => revoke(inv.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="label">Members</div>
        {data.members.map((m) => (
          <Card key={m.userId} className="flex items-center gap-4">
            <div className="w-10 h-10 grid place-items-center bg-surface-2 border border-line-strong text-ink font-bold">
              {(m.name || m.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-ink font-medium truncate">
                {m.name || m.email.split("@")[0]}
                {m.userId === data.currentUserId && (
                  <span className="text-ink-dim font-normal"> (you)</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-ink-dim truncate">
                {m.email}
              </div>
            </div>
            <span
              className={`ml-auto font-mono text-[11px] uppercase tracking-wide px-2.5 py-1 border ${
                m.role === "owner"
                  ? "text-accent border-accent/40"
                  : "text-ink-dim border-line-strong"
              }`}
            >
              {m.role}
            </span>
            {isOwner && m.userId !== data.ownerId && (
              <button
                onClick={() => removeMember(m.userId)}
                className="px-3 py-1.5 text-ink-dim hover:text-crit border border-line hover:border-crit/40"
                title="Remove member"
              >
                ✕
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
