"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, inr } from "@/lib/api";
import { Card, PageHeader, PageTitle } from "@/components/ui";
import UserDetailPanel from "@/components/UserDetailPanel";


interface Stats {
  patients: number;
  hospitals: number;
  pending_hospitals: number;
  quote_requests: number;
  quotes: number;
  total_quoted_value: number;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/api/admin/stats").then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
          <UserDetailPanel role="admin" />
          <PageTitle title="Overview — MediConnect Admin" />
      <PageHeader
        title="Platform overview"
        subtitle="Health of the MediConnect marketplace at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Hospitals listed" value={stats?.hospitals ?? "—"} sub={`${stats?.pending_hospitals ?? 0} pending approval`} />
        <StatCard label="Registered patients" value={stats?.patients ?? "—"} />
        <StatCard label="Quote requests" value={stats?.quote_requests ?? "—"} />
        <StatCard label="Quotes issued" value={stats?.quotes ?? "—"} accent />
        <StatCard label="Total quoted value" value={stats ? inr(stats.total_quoted_value) : "—"} />
        <Card className="flex flex-col justify-between bg-accent p-5 text-white">
          <div>
            <p className="text-sm text-slate-300">Action needed</p>
          <p className={`mt-1 text-3xl font-semibold${(stats?.pending_hospitals ?? 0) > 0 ? " animate-pulse" : ""}`}>
              {stats?.pending_hospitals ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">hospitals awaiting review</p>
          </div>
          <Link
            href="/admin/hospitals"
            className="mt-4 inline-flex justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-accent transition hover:bg-slate-100"
          >
            Review hospitals
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Quick links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/hospitals", label: "Manage hospitals" },
            { href: "/admin/patients", label: "View patients" },
            { href: "/admin/requests", label: "All quote activity" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-surface-muted"
            >
              {l.label} →
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
