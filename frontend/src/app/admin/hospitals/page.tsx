"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate } from "@/lib/api";
import { Badge, Button, Card, EmptyState, PageHeader, PageTitle, useToast } from "@/components/ui";

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

export default function AdminHospitals() {
  const { toast, node } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "suspended">("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<Hospital[]>("/api/admin/hospitals")
      .then((data) => setHospitals(data))
      .catch((err) => {
        toast(err instanceof Error ? err.message : "Failed to load hospitals", "error");
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);


  async function setStatus(id: number, status: string) {
    try {
      await api(`/api/admin/hospitals/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast(`Hospital ${status}`);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  const shown =
    filter === "all" ? hospitals : hospitals.filter((h) => h.status === filter);

  const filters = ["all", "pending", "approved", "suspended"] as const;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {node}
      <PageTitle title="Hospitals — MediConnect Admin" />
      <PageHeader
        title="Hospitals"
        subtitle="Approve, suspend, or reinstate hospital listings."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = filter === f;
          const cnt = f !== "all" ? hospitals.filter((h) => h.status === f).length : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors duration-150 ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-surface text-muted ring-1 ring-inset ring-border hover:bg-surface-muted"
              }`}
            >
              {f}
              {cnt !== null && (
                isActive
                  ? <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">{cnt}</span>
                  : <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-muted">{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Nothing here" hint="No hospitals match this filter." />
      ) : (
        <div className="space-y-3">
          {shown.map((h) => (
            <Card key={h.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/hospitals/${h.id}`} className="font-semibold text-primary hover:underline">{h.name}</Link>
                  <Badge status={h.status} />
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {h.email} · {h.city || "—"} · joined {formatDate(h.created_at)}
                </p>
                {h.specialties && (
                  <p className="mt-1 text-sm text-muted">{h.specialties}</p>
                )}
              </div>
              <div className="flex gap-2">
                {h.status !== "approved" && (
                  <Button size="sm" onClick={() => setStatus(h.id, "approved")}>
                    Approve
                  </Button>
                )}
                {h.status !== "suspended" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(h.id, "suspended")}>
                    Suspend
                  </Button>
                )}
                {h.status === "suspended" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(h.id, "pending")}>
                    Reset to pending
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

