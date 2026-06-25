"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, saveSession, type Session } from "@/lib/api";
import { Button, Input, Label, Logo, Textarea } from "@/components/ui";

export default function RegisterHospital() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    phone: "",
    specialties: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await api<Session>("/api/auth/register/hospital", {
        method: "POST",
        auth: false,
        body: JSON.stringify(form),
      });
      saveSession(session);
      router.push("/hospital");
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
          <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
            Hospital partner
          </span>
          <h1 className="mt-3 text-xl font-semibold">List your hospital</h1>
          <p className="mt-1 text-sm text-muted">
            Reach pre-qualified, policy-backed patients. Your listing goes live
            after a quick review by our team.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Hospital name</Label>
              <Input required value={form.name} onChange={set("name")} placeholder="Apollo Speciality Hospital" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Work email</Label>
                <Input type="email" required value={form.email} onChange={set("email")} placeholder="desk@hospital.io" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="Min. 6 characters" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={set("city")} placeholder="Mumbai" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={set("phone")} placeholder="+91…" />
              </div>
            </div>
            <div>
              <Label>Specialities</Label>
              <Input value={form.specialties} onChange={set("specialties")} placeholder="Cardiology, Oncology, Orthopedics" />
            </div>
            <div>
              <Label>About the hospital</Label>
              <Textarea value={form.description} onChange={set("description")} placeholder="Accreditations, bed strength, cashless insurance desk…" />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Submit for review
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already listed?{" "}
            <Link href="/login?role=hospital" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
