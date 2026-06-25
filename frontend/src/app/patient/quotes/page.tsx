"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, inr } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader, PageTitle } from "@/components/ui";

interface Req {
  id: number;
  treatment_needed: string;
  status: string;
  hospital_name: string;
  hospital_city: string | null;
  message: string | null;
  created_at: string;
}
interface Quote {
  id: number;
  request_id: number;
  hospital_name: string;
  treatment_needed: string;
  estimated_cost: number;
  insurance_covered: number;
  out_of_pocket: number;
  validity_days: number;
  notes: string | null;
  created_at: string;
}

function ReceiptIcon() {
  return (
    <svg className="h-10 w-10 text-muted" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 6h20v36l-5-3-5 3-5-3-5 3V6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M19 17h10M19 24h10M19 31h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function QuotesPage() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    api<Req[]>("/api/patient/quote-requests").then(setReqs).catch(() => {});
    api<Quote[]>("/api/patient/quotes").then(setQuotes).catch(() => {});
  }, []);

  const quoteFor = (reqId: number) => quotes.filter((q) => q.request_id === reqId);

  return (
    <div className="space-y-8">
      <PageTitle title="My Quotes — MediConnect" />
      <div className="flex items-end justify-between">
        <PageHeader
          title="My quotes"
          subtitle="Track your requests and compare hospital quotes."
        />
        <Link
          href="/patient/request"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          New request
        </Link>
      </div>

      {reqs.length === 0 ? (
        <EmptyState
          title="No requests yet"
          hint="Request a quote and your hospital responses will appear here."
          icon={<ReceiptIcon />}
        />
      ) : (
        <div className="space-y-5">
          {reqs.map((r) => {
            const qs = quoteFor(r.id);
            return (
              <Card key={r.id} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-surface-muted/40 px-6 py-4">
                  <div>
                    <p className="font-semibold">{r.treatment_needed}</p>
                    <p className="text-sm text-muted">
                      {r.hospital_name}
                      {r.hospital_city ? ` · ${r.hospital_city}` : ""} ·{" "}
                      {formatDate(r.created_at)}
                    </p>
                  </div>
                  <Badge status={r.status} />
                </div>

                <div className="px-6 py-5">
                  {qs.length === 0 ? (
                    <p className="text-sm text-muted">
                      Awaiting the hospital&apos;s quote. You&apos;ll see the
                      cost breakdown here once it&apos;s ready.
                    </p>
                  ) : (
                    qs.map((q) => (
                      <div key={q.id} className="rounded-xl border border-border p-5">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted">
                              Estimated cost
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                              {inr(q.estimated_cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted">
                              Insurance covered
                            </p>
                            <p className="mt-1 text-lg font-semibold text-success">
                              {inr(q.insurance_covered)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted">
                              Your out-of-pocket
                            </p>
                            <p className="mt-1 text-lg font-semibold text-primary">
                              {inr(q.out_of_pocket)}
                            </p>
                          </div>
                        </div>
                        {q.notes && (
                          <p className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-sm text-muted">
                            {q.notes}
                          </p>
                        )}
                        <p className="mt-3 text-xs text-muted">
                          Valid for {q.validity_days} days · issued{" "}
                          {formatDate(q.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
