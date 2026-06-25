"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, saveSession, ApiError, type Role, type Session } from "@/lib/api";
import { Button, Input, Label, Logo } from "@/components/ui";

const ROLES: { key: Role; label: string; hint: string }[] = [
  { key: "patient", label: "Patient", hint: "Get treatment quotes" },
  { key: "hospital", label: "Hospital", hint: "Manage your listing" },
  { key: "admin", label: "Tech / Admin", hint: "Platform control" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("role") as Role) || "patient";
  const [role, setRole] = useState<Role>(
    ["patient", "hospital", "admin"].includes(initial) ? initial : "patient"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await api<Session>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password, role }),
      });
      saveSession(session);
      // Always go back to landing page after login
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password. Make sure you are using the correct account from our records.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-muted p-1">
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRole(r.key)}
            className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
              role === r.key
                ? "bg-surface text-primary shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div>
        <Label>Email</Label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger ring-1 ring-inset ring-red-200">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Sign in
      </Button>

      <p className="text-center text-sm text-muted">
        Back to{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Home
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">
            Medi<span className="text-primary">Connect</span>
          </span>
        </Link>
        <div className="card p-8">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to continue. After login you will return to the home page.
          </p>
          <div className="mt-6">
            <Suspense fallback={<div className="h-72" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface-muted/60 p-4 text-xs leading-relaxed text-muted">
          <p className="font-medium text-foreground">Demo accounts</p>
          <p className="mt-1 font-medium text-foreground mt-2">Patients</p>
          <p>aarav.sharma@gmail.com / patient@1234</p>
          <p>priya.patel@gmail.com / patient@1234</p>
          <p className="font-medium text-foreground mt-2">Hospitals</p>
          <p>citycare@hospital.com / hospital@1234</p>
          <p>sunrise@hospital.com / hospital@1234</p>
          <p className="font-medium text-foreground mt-2">Admin</p>
          <p>admin@connector.io / admin123</p>
        </div>
      </div>
    </div>
  );
}
