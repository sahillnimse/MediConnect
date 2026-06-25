"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, getSession, inr } from "@/lib/api";
import { Badge, Card, PageHeader, PageTitle } from "@/components/ui";
import UserDetailPanel from "@/components/UserDetailPanel";

interface Policy { id: number; insurer: string; sum_insured: number }
interface Rx { id: number; diagnosis: string }
interface Req { id: number; treatment_needed: string; status: string; hospital_name: string; created_at: string }
interface Quote { id: number; hospital_name: string; out_of_pocket: number }

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

export default function PatientOverview() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [rx, setRx] = useState<Rx[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const name = getSession()?.name ?? "there";

  useEffect(() => {
    Promise.all([
      api<Policy[]>("/api/patient/policies"),
      api<Rx[]>("/api/patient/prescriptions"),
      api<Req[]>("/api/patient/quote-requests"),
      api<Quote[]>("/api/patient/quotes"),
    ]).then(([p, r, q, qt]) => {
      setPolicies(p);
      setRx(r);
      setReqs(q);
      setQuotes(qt);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
          <UserDetailPanel role="patient" />
          <PageTitle title="Overview — MediConnect" />
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="Here's the status of your treatment quotes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Insurance policies" value={policies.length} />
        <StatCard label="Prescriptions" value={rx.length} />
        <StatCard label="Quote requests" value={reqs.length} />
        <StatCard label="Quotes received" value={quotes.length} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent requests</h2>
            <Link href="/patient/quotes" className="text-sm font-medium text-primary hover:underline">
              View quotes →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {reqs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">
                No requests yet. <Link href="/patient/request" className="text-primary hover:underline">Request your first quote.</Link>
              </p>
            )}
            {reqs.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.treatment_needed}</p>
                  <p className="text-sm text-muted">
                    {r.hospital_name} · {formatDate(r.created_at)}
                  </p>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-accent p-6 text-white">
          <div>
            <h2 className="font-semibold">Ready for a new quote?</h2>
            <p className="mt-2 text-sm text-slate-300">
              Add a prescription, attach your policy, and pick the hospitals you
              want an estimate from.
            </p>
          </div>
          <Link
            href="/patient/request"
            className="mt-6 inline-flex justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-slate-100"
          >
            Request a quote
          </Link>
        </Card>
      </div>

      {quotes.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold">Latest quotes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quotes.slice(0, 4).map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <span className="text-sm font-medium">{q.hospital_name}</span>
                <span className="text-sm">
                  Out-of-pocket{" "}
                  <span className="font-semibold text-primary">{inr(q.out_of_pocket)}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
