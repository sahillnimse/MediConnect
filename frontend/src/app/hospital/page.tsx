"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, inr } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader, PageTitle } from "@/components/ui";
import UserDetailPanel from "@/components/UserDetailPanel";

interface Profile {
  name: string;
  status: string;
  city: string | null;
  specialties: string | null;
}
interface Req {
  id: number;
  treatment_needed: string;
  status: string;
  patient_name: string;
  created_at: string;
  quote_count: number;
}
interface Quote { id: number; estimated_cost: number }

function InboxIcon() {
  return (
    <svg className="h-10 w-10 text-muted" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M10 17h28l4 11v10H6V28l4-11Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M6 28h11l3 5h8l3-5h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
    </Card>
  );
}

export default function HospitalOverview() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    api<Profile>("/api/hospital/profile").then(setProfile).catch(() => {});
    api<Req[]>("/api/hospital/requests").then(setReqs).catch(() => {});
    api<Quote[]>("/api/hospital/quotes").then(setQuotes).catch(() => {});
  }, []);

  const pending = reqs.filter((r) => r.status === "pending").length;
  const totalQuoted = quotes.reduce((s, q) => s + q.estimated_cost, 0);

  return (
    <div className="space-y-8">
          <UserDetailPanel role="hospital" />
          <PageTitle title="Overview — MediConnect Hospital" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title={profile?.name ?? "Your hospital"}
          subtitle={`${profile?.city || "—"}${profile?.specialties ? ` · ${profile.specialties}` : ""}`}
        />
        {profile && <Badge status={profile.status} />}
      </div>

      {profile?.status !== "approved" && profile && (
        <div className="flex items-start gap-3 rounded-2xl border border-l-4 border-amber-200 border-l-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <p className="font-medium">Your listing is {profile.status}.</p>
            <p className="mt-0.5">
              Patients can only send you quote requests once our team approves your
              hospital. We&apos;ll notify you shortly.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total requests" value={reqs.length} />
        <StatCard label="Awaiting quote" value={pending} accent />
        <StatCard label="Quotes issued" value={quotes.length} />
        <StatCard label="Quoted value" value={inr(totalQuoted)} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Latest requests</h2>
          <Link href="/hospital/requests" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-border">
          {reqs.length === 0 && (
            <EmptyState
              title="No quote requests yet"
              hint="New patient requests will appear here as soon as they arrive."
              icon={<InboxIcon />}
            />
          )}
          {reqs.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{r.treatment_needed}</p>
                <p className="text-sm text-muted">
                  {r.patient_name} · {formatDate(r.created_at)}
                </p>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
