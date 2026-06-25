"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, inr } from "@/lib/api";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  PageHeader,
  PageTitle,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

interface Hospital {
  id: number;
  name: string;
  city: string | null;
  specialties: string | null;
}
interface Rx { id: number; diagnosis: string }
interface Policy { id: number; insurer: string; policy_number: string }
interface Procedure {
  id: number;
  procedure_name: string;
  specialty: string;
  avg_cost: number;
  success_rate_percent: number;
  avg_days_stay: number;
  notes: string | null;
}

export default function RequestQuotePage() {
  const router = useRouter();
  const { toast, node } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [rx, setRx] = useState<Rx[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [expandedHospital, setExpandedHospital] = useState<number | null>(null);
  const [procedures, setProcedures] = useState<Record<number, Procedure[]>>({});
  const [loadingProcedures, setLoadingProcedures] = useState<Record<number, boolean>>({});
  const [treatment, setTreatment] = useState("");
  const [message, setMessage] = useState("");
  const [rxId, setRxId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Hospital[]>("/api/patient/hospitals").then(setHospitals).catch(() => {});
    api<Rx[]>("/api/patient/prescriptions").then(setRx).catch(() => {});
    api<Policy[]>("/api/patient/policies").then(setPolicies).catch(() => {});
  }, []);

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleProcedures(hospitalId: number) {
    setExpandedHospital((current) => (current === hospitalId ? null : hospitalId));
    if (procedures[hospitalId] || loadingProcedures[hospitalId]) return;

    setLoadingProcedures((current) => ({ ...current, [hospitalId]: true }));
    api<Procedure[]>(`/api/patient/hospitals/${hospitalId}/procedures`)
      .then((items) => {
        setProcedures((current) => ({ ...current, [hospitalId]: items }));
      })
      .catch(() => {
        setProcedures((current) => ({ ...current, [hospitalId]: [] }));
      })
      .finally(() => {
        setLoadingProcedures((current) => ({ ...current, [hospitalId]: false }));
      });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      toast("Select at least one hospital", "error");
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        selected.map((hospital_id) =>
          api("/api/patient/quote-requests", {
            method: "POST",
            body: JSON.stringify({
              hospital_id,
              treatment_needed: treatment,
              message: message || null,
              prescription_id: rxId ? Number(rxId) : null,
              policy_id: policyId ? Number(policyId) : null,
            }),
          })
        )
      );
      toast(`Request sent to ${selected.length} hospital(s)`);
      router.push("/patient/quotes");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {node}
      <PageTitle title="Find Hospitals - MediConnect" />
      <PageHeader
        title="Request a quote"
        subtitle="Describe what you need, attach your records, and choose hospitals."
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <h2 className="font-semibold">Treatment details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Treatment needed</Label>
                <Input
                  required
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Coronary angioplasty with stent"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Attach prescription</Label>
                  <Select value={rxId} onChange={(e) => setRxId(e.target.value)}>
                    <option value="">None</option>
                    {rx.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.diagnosis}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Attach policy</Label>
                  <Select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
                    <option value="">None</option>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.insurer} - {p.policy_number}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Message to hospital (optional)</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please share a cashless estimate against my policy."
                />
              </div>
            </div>
            {(rx.length === 0 || policies.length === 0) && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-inset ring-amber-200">
                Tip: add a{" "}
                <Link href="/patient/prescriptions" className="font-medium underline">
                  prescription
                </Link>{" "}
                and{" "}
                <Link href="/patient/policies" className="font-medium underline">
                  policy
                </Link>{" "}
                for a more accurate quote.
              </p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Choose hospitals</h2>
              <span className="text-sm text-muted">{selected.length} selected</span>
            </div>
            <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {hospitals.length === 0 ? (
                <EmptyState title="No hospitals available" hint="Check back soon - hospitals are being onboarded." />
              ) : (
                hospitals.map((h) => {
                  const on = selected.includes(h.id);
                  const expanded = expandedHospital === h.id;
                  const hospitalProcedures = procedures[h.id] ?? [];

                  return (
                    <div
                      key={h.id}
                      className={`rounded-xl border p-3 transition ${
                        on
                          ? "border-primary bg-primary-soft/40"
                          : "border-border hover:bg-surface-muted"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(h.id)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            on ? "border-primary bg-primary text-white" : "border-border"
                          }`}
                        >
                          {on && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{h.name}</span>
                          <span className="block text-xs text-muted">
                            {h.city || "-"}
                            {h.specialties ? ` - ${h.specialties}` : ""}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleProcedures(h.id)}
                        className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                        aria-expanded={expanded}
                      >
                        <span>Procedures & Success Rates</span>
                        <span>{expanded ? "Hide" : "View"}</span>
                      </button>

                      {expanded && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface">
                          {loadingProcedures[h.id] ? (
                            <div className="flex items-center justify-center py-6 text-sm text-muted">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                            </div>
                          ) : hospitalProcedures.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-muted">
                              Procedure history is not available yet.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[34rem] text-left text-xs">
                                <thead className="bg-surface-muted text-muted">
                                  <tr>
                                    <th className="px-3 py-2 font-medium">Procedure</th>
                                    <th className="px-3 py-2 font-medium">Specialty</th>
                                    <th className="px-3 py-2 font-medium">Avg cost</th>
                                    <th className="px-3 py-2 font-medium">Stay</th>
                                    <th className="px-3 py-2 font-medium">Success</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {hospitalProcedures.map((p) => (
                                    <tr key={p.id}>
                                      <td className="px-3 py-2 align-top">
                                        <p className="font-medium text-foreground">{p.procedure_name}</p>
                                        {p.notes && (
                                          <p className="mt-0.5 max-w-56 text-muted">{p.notes}</p>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 align-top text-muted">{p.specialty}</td>
                                      <td className="px-3 py-2 align-top font-medium">{inr(p.avg_cost)}</td>
                                      <td className="px-3 py-2 align-top text-muted">{p.avg_days_stay} days</td>
                                      <td className="px-3 py-2 align-top">
                                        <div className="flex min-w-24 items-center gap-2">
                                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-green-100">
                                            <div
                                              className="h-full rounded-full bg-success"
                                              style={{
                                                width: `${Math.max(0, Math.min(100, p.success_rate_percent))}%`,
                                              }}
                                            />
                                          </div>
                                          <span className="w-10 text-right font-semibold text-success">
                                            {p.success_rate_percent}%
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <Button type="submit" loading={loading} className="mt-5 w-full" size="lg">
              Send request{selected.length > 0 ? ` (${selected.length})` : ""}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
