"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader, PageTitle } from "@/components/ui";

interface Req {
  id: number;
  treatment_needed: string;
  status: string;
  created_at: string;
  patient_name: string;
  hospital_name: string;
}

export default function AdminRequests() {
  const [reqs, setReqs] = useState<Req[]>([]);

  useEffect(() => {
    api<Req[]>("/api/admin/requests").then(setReqs).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle title="All Requests — MediConnect Admin" />
      <PageHeader
        title="All quote activity"
        subtitle="Every quote request flowing through the platform."
      />

      {reqs.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <Card className="overflow-hidden">
          <p className="px-5 pb-3 pt-4 text-sm text-muted">
            {reqs.length} requests total
          </p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-left text-muted">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Hospital</th>
                <th className="px-5 py-3 font-medium">Treatment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reqs.map((r) => (
                <tr key={r.id} className="hover:bg-surface-muted/40">
                  <td className="px-5 py-3 font-medium">{r.patient_name}</td>
                  <td className="px-5 py-3">{r.hospital_name}</td>
                  <td className="px-5 py-3 text-muted">{r.treatment_needed}</td>
                  <td className="px-5 py-3">
                    <Badge status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
}
