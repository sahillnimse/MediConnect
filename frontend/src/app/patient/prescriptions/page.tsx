"use client";

import { useEffect, useState } from "react";
import { api, apiUpload, formatDate } from "@/lib/api";
import {
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
import DocumentUploadField from "@/components/DocumentUpload";

interface Rx {
  id: number;
  doctor_name: string | null;
  diagnosis: string;
  medications: string | null;
  notes: string | null;
  document_id: number | null;
  created_at: string;
}

interface UploadedDocState {
  id: number;
  filename: string;
  sizeBytes: number;
}

const blank = { doctor_name: "", diagnosis: "", medications: "", notes: "" };

export default function PrescriptionsPage() {
  const [items, setItems] = useState<Rx[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [doc, setDoc] = useState<UploadedDocState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, node } = useToast();

  const load = () =>
    api<Rx[]>("/api/patient/prescriptions").then(setItems).catch(() => { });
  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("doc_type", "prescription");
      fd.append("file", file);
      const saved = await apiUpload<{ id: number }>("/api/patient/documents", fd);
      setDoc({ id: saved.id, filename: file.name, sizeBytes: file.size });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function clearDoc() {
    if (doc) {
      await api(`/api/patient/documents/${doc.id}`, { method: "DELETE" }).catch(() => { });
    }
    setDoc(null);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/patient/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          document_id: doc?.id ?? null,
        }),
      });
      setForm({ ...blank });
      setDoc(null);
      toast("Prescription saved");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    await api(`/api/patient/prescriptions/${id}`, { method: "DELETE" });
    toast("Removed");
    load();
  }

  return (
    <div className="space-y-8">
      {node}
      <PageTitle title="My Prescriptions — MediConnect" />
      <PageHeader
        title="Prescriptions"
        subtitle="Record your diagnosis and medication so hospitals can quote accurately."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">Add a prescription</h2>
          <form onSubmit={add} className="mt-4 space-y-4">
            <DocumentUploadField
              label="Prescription document"
              uploading={uploading}
              uploaded={doc ? { filename: doc.filename, sizeBytes: doc.sizeBytes } : null}
              onSelect={uploadFile}
              onClear={clearDoc}
            />
            <div>
              <Label>Doctor</Label>
              <Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="Dr. Kapoor" />
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Input required value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Coronary artery disease" />
            </div>
            <div>
              <Label>Medications</Label>
              <Textarea value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} placeholder="Aspirin 75mg, Atorvastatin 40mg" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Procedure advised, timeline, etc." />
            </div>
            <Button type="submit" loading={loading} disabled={uploading} className="w-full">
              Save prescription
            </Button>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {items.length === 0 ? (
            <EmptyState title="No prescriptions yet" hint="Add a prescription to attach it to a quote request." />
          ) : (
            items.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.diagnosis}</p>
                      {p.document_id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
                          </svg>
                          Document attached
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {p.doctor_name || "—"} · {formatDate(p.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-sm font-medium text-muted hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
                {p.medications && (
                  <p className="mt-3 text-sm">
                    <span className="text-muted">Medications: </span>
                    {p.medications}
                  </p>
                )}
                {p.notes && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Notes: </span>
                    {p.notes}
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}