"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";
import { Card, EmptyState, PageHeader, PageTitle } from "@/components/ui";

interface Patient {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  created_at: string;
}

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    api<Patient[]>("/api/admin/patients").then(setPatients).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle title="Patients — MediConnect Admin" />
      <PageHeader
        title="Patients"
        subtitle="Everyone registered on the platform."
      />

      {patients.length === 0 ? (
        <EmptyState title="No patients yet" />
      ) : (
        <Card className="overflow-hidden">
          <p className="px-5 pb-3 pt-4 text-sm text-muted">
            Showing {patients.length} patients
          </p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-left text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-surface-muted/40">
                  <td className="px-5 py-3 font-medium">{p.full_name}</td>
                  <td className="px-5 py-3 text-muted">{p.email}</td>
                  <td className="px-5 py-3 text-muted">{p.phone || "—"}</td>
                  <td className="px-5 py-3 text-muted">{p.city || "—"}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(p.created_at)}</td>
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
