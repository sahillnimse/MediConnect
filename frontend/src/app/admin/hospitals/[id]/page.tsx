"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, formatDate } from "@/lib/api";
import { Card, PageHeader, PageTitle, Badge } from "@/components/ui";
import UserDetailPanel from "@/components/UserDetailPanel";

interface Hospital {
  id: number;
  name: string;
  email: string;
  city: string | null;
  phone: string | null;
  specialties: string | null;
  status: string;
  created_at: string;
}

export default function AdminHospitalDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    api<Hospital>(`/api/admin/hospitals/${params.id}`)
      .then(setHospital)
      .catch(() => router.replace("/admin/hospitals"));
  }, [params.id, router]);

  if (!hospital) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <div className="space-y-8">
      <UserDetailPanel role="hospital" />
      <PageTitle title={`Hospital – ${hospital.name}`} />
      <PageHeader
        title={hospital.name}
        subtitle={`${hospital.city || "—"}${hospital.specialties ? ` • ${hospital.specialties}` : ""}`}
      />
      <Badge status={hospital.status} />
      <Card className="p-6">
        <p className="text-sm text-muted">
          Email: {hospital.email}<br />
          Phone: {hospital.phone || "—"}<br />
          Joined: {formatDate(hospital.created_at)}
        </p>
      </Card>
    </div>
  );
}
