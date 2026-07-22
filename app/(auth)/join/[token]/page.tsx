"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";

interface InviteInfo {
  email: string;
  workspaceName: string;
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/team/invite/check?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => setInvite(j.invite ?? null))
      .finally(() => setChecking(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not accept invite");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invite");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <p className="text-ink-dim text-sm text-center">Checking invite…</p>
    );
  }

  if (!invite) {
    return (
      <Card block className="text-center flex flex-col gap-3">
        <h1 className="font-bold text-ink text-lg">Invite not valid</h1>
        <p className="text-sm text-ink-dim">
          This invite link is invalid or has expired. Ask your workspace owner
          for a fresh one.
        </p>
        <Link href="/login" className="text-accent underline text-sm">
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-10 grid place-items-center bg-accent text-accent-ink font-black text-xl shadow-block-sm">
          ◐
        </span>
        <div className="leading-tight">
          <div className="font-bold tracking-tight text-ink text-lg">
            Creator Scout
          </div>
          <div className="label !text-[9px] !tracking-[0.2em]">
            Join {invite.workspaceName}
          </div>
        </div>
      </div>

      <Card block>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-ink-dim">
            You&apos;re joining{" "}
            <span className="text-ink font-medium">{invite.workspaceName}</span>{" "}
            as{" "}
            <span className="font-mono text-ink">{invite.email}</span>. Set your
            name and a password.
          </p>
          {error && (
            <div className="border border-crit/50 bg-crit/10 text-ink px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <Field label="Your name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              autoComplete="name"
            />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Creating account…" : "Join workspace"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
