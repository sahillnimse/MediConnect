"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, saveSession, type Session } from "@/lib/api";
import { Button, Input, Label, Logo } from "@/components/ui";

export default function RegisterPatient() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    dob: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await api<Session>("/api/auth/register/patient", {
        method: "POST",
        auth: false,
        body: JSON.stringify(form),
      });
      saveSession(session);
      router.push("/patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">
            Medi<span className="text-primary">Connect</span>
          </span>
        </Link>
        <div className="card p-8">
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-dark">
            Patient account
          </span>
          <h1 className="mt-3 text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Start collecting free, transparent treatment quotes.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Full name</Label>
              <Input required value={form.full_name} onChange={set("full_name")} placeholder="Riya Sharma" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Email</Label>
                <Input type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="Min. 6 characters" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={set("phone")} placeholder="+91…" />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={set("city")} placeholder="Mumbai" />
              </div>
              <div>
                <Label>Date of birth</Label>
                <Input type="date" value={form.dob} onChange={set("dob")} />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Are you a hospital?{" "}
          <Link href="/register/hospital" className="font-medium text-primary hover:underline">
            List your hospital
          </Link>
        </p>
      </div>
    </div>
  );
}
