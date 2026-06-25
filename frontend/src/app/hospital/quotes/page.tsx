"use client";

import { useEffect, useState } from "react";
import { api, formatDate, inr } from "@/lib/api";
import { Card, EmptyState, PageHeader, PageTitle } from "@/components/ui";

interface Quote {
  id: number;
  patient_name: string;
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

export default function HospitalQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    api<Quote[]>("/api/hospital/quotes").then(setQuotes).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle title="Quotes Issued — MediConnect Hospital" />
      <PageHeader
        title="Quotes issued"
        subtitle="Every quote your team has sent to patients."
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="No quotes issued yet"
          hint="Issue your first quote from the Quote requests tab."
          icon={<ReceiptIcon />}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-left text-muted">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Treatment</th>
                <th className="px-5 py-3 text-right font-medium">Estimated</th>
                <th className="px-5 py-3 text-right font-medium">Covered</th>
                <th className="px-5 py-3 text-right font-medium">Out-of-pocket</th>
                <th className="px-5 py-3 font-medium">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-surface-muted/40">
                  <td className="px-5 py-3 font-medium">{q.patient_name}</td>
                  <td className="px-5 py-3">{q.treatment_needed}</td>
                  <td className="px-5 py-3 text-right">{inr(q.estimated_cost)}</td>
                  <td className="px-5 py-3 text-right text-success">{inr(q.insurance_covered)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-primary">{inr(q.out_of_pocket)}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(q.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
