"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
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
            Outreach console
          </div>
        </div>
      </div>

      <Card block>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <h1 className="font-mono text-xs tracking-[0.14em] uppercase text-ink-dim">
            Sign in
          </h1>
          {error && (
            <div className="border border-crit/50 bg-crit/10 text-ink px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-ink-dim">
        Invite-only. Ask your workspace owner for an invite link.
      </p>
    </div>
  );
}
