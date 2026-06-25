"use client";

import { useEffect, useMemo, useState } from "react";
import { api, formatDate, inr } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  PageHeader,
  PageTitle,
  Textarea,
  useToast,
} from "@/components/ui";

interface Req {
  id: number;
  treatment_needed: string;
  message: string | null;
  status: string;
  created_at: string;
  patient_name: string;
  patient_city: string | null;
  diagnosis: string | null;
  medications: string | null;
  doctor_name: string | null;
  insurer: string | null;
  policy_number: string | null;
  sum_insured: number | null;
  policy_type: string | null;
  quote_count: number;
}

function QuoteForm({
  req,
  onDone,
}: {
  req: Req;
  onDone: () => void;
}) {
  const { toast, node } = useToast();
  const [cost, setCost] = useState("");
  const [covered, setCovered] = useState("");
  const [validity, setValidity] = useState("30");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const oop = useMemo(() => {
    const c = parseFloat(cost || "0");
    const v = parseFloat(covered || "0");
    return Math.max(0, c - v);
  }, [cost, covered]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/hospital/quotes", {
        method: "POST",
        body: JSON.stringify({
          request_id: req.id,
          estimated_cost: parseFloat(cost || "0"),
          insurance_covered: parseFloat(covered || "0"),
          out_of_pocket: oop,
          validity_days: parseInt(validity || "30", 10),
          notes: notes || null,
        }),
      });
      toast("Quote issued");
      onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-border bg-surface-muted/40 p-5">
      {node}
      <h4 className="font-medium">Prepare a quote</h4>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Estimated cost (₹)</Label>
          <Input type="number" min="0" required value={cost} onChange={(e) => setCost(e.target.value)} placeholder="250000" />
        </div>
        <div>
          <Label>Insurance covered (₹)</Label>
          <Input type="number" min="0" value={covered} onChange={(e) => setCovered(e.target.value)} placeholder="200000" />
        </div>
        <div>
          <Label>Validity (days)</Label>
          <Input type="number" min="1" value={validity} onChange={(e) => setValidity(e.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <Label>Notes for the patient</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cashless package incl. stent, room category, inclusions…" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          Patient out-of-pocket:{" "}
          <span className="font-semibold text-primary">{inr(oop)}</span>
        </p>
        <Button type="submit" loading={loading}>
          Issue quote
        </Button>
      </div>
    </form>
  );
}

export default function HospitalRequests() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const load = () =>
    api<Req[]>("/api/hospital/requests").then(setReqs).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle title="Quote Requests — MediConnect Hospital" />
      <PageHeader
        title="Quote requests"
        subtitle="Review each patient's clinical and policy details, then issue a transparent quote."
      />

      {reqs.length === 0 ? (
        <EmptyState
          title="No requests yet"
          hint="Once your hospital is approved, patient quote requests will appear here."
        />
      ) : (
        <div className="space-y-5">
          {reqs.map((r) => (
            <Card key={r.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{r.treatment_needed}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {r.patient_name}
                    {r.patient_city ? ` · ${r.patient_city}` : ""} ·{" "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <Badge status={r.status} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Clinical
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="text-muted">Diagnosis: </span>
                    {r.diagnosis || "Not provided"}
                  </p>
                  {r.medications && (
                    <p className="mt-1 text-sm">
                      <span className="text-muted">Medications: </span>
                      {r.medications}
                    </p>
                  )}
                  {r.doctor_name && (
                    <p className="mt-1 text-sm">
                      <span className="text-muted">Doctor: </span>
                      {r.doctor_name}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Insurance
                  </p>
                  {r.insurer ? (
                    <>
                      <p className="mt-2 text-sm">
                        <span className="text-muted">Insurer: </span>
                        {r.insurer} ({r.policy_type || "—"})
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-muted">Policy #: </span>
                        {r.policy_number}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-muted">Sum insured: </span>
                        {inr(r.sum_insured)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted">No policy attached.</p>
                  )}
                </div>
              </div>

              {r.message && (
                <p className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-sm">
                  <span className="text-muted">Patient note: </span>
                  {r.message}
                </p>
              )}

              <div className="mt-5 flex items-center gap-3">
                <Button
                  variant={open === r.id ? "outline" : "primary"}
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                >
                  {open === r.id ? "Cancel" : r.quote_count > 0 ? "Add another quote" : "Issue quote"}
                </Button>
                {r.quote_count > 0 && (
                  <span className="text-sm text-muted">
                    {r.quote_count} quote(s) issued
                  </span>
                )}
              </div>

              {open === r.id && (
                <QuoteForm
                  req={r}
                  onDone={() => {
                    setOpen(null);
                    load();
                  }}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
