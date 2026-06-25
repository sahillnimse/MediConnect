"use client";

import { useEffect, useState } from "react";
import { api, apiUpload, formatDate, inr } from "@/lib/api";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  PageHeader,
  PageTitle,
  Select,
  useToast,
} from "@/components/ui";
import DocumentUploadField from "@/components/DocumentUpload";

interface Policy {
  id: number;
  insurer: string;
  policy_number: string;
  policy_type: string | null;
  sum_insured: number;
  valid_till: string | null;
  document_id: number | null;
}

interface UploadedDocState {
  id: number;
  filename: string;
  sizeBytes: number;
}

const blank = {
  insurer: "",
  policy_number: "",
  policy_type: "Family Floater",
  sum_insured: "",
  valid_till: "",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [doc, setDoc] = useState<UploadedDocState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, node } = useToast();

  const load = () =>
    api<Policy[]>("/api/patient/policies").then(setPolicies).catch(() => { });
  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("doc_type", "policy");
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
    if (!doc) {
      toast("Upload your policy document first", "error");
      return;
    }
    setLoading(true);
    try {
      await api("/api/patient/policies", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          sum_insured: parseFloat(form.sum_insured || "0"),
          document_id: doc.id,
        }),
      });
      setForm({ ...blank });
      setDoc(null);
      toast("Policy added");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    await api(`/api/patient/policies/${id}`, { method: "DELETE" });
    toast("Policy removed");
    load();
  }

  return (
    <div className="space-y-8">
      {node}
      <PageTitle title="My Policies — MediConnect" />
      <PageHeader
        title="Insurance policies"
        subtitle="Add the policies you want hospitals to quote against."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">Add a policy</h2>
          <form onSubmit={add} className="mt-4 space-y-4">
            <DocumentUploadField
              label="Policy document"
              required
              uploading={uploading}
              uploaded={doc ? { filename: doc.filename, sizeBytes: doc.sizeBytes } : null}
              onSelect={uploadFile}
              onClear={clearDoc}
            />
            <div>
              <Label>Insurer</Label>
              <Input required value={form.insurer} onChange={(e) => setForm({ ...form, insurer: e.target.value })} placeholder="Star Health" />
            </div>
            <div>
              <Label>Policy number</Label>
              <Input required value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} placeholder="SH-2291-8841" />
            </div>
            <div>
              <Label>Policy type</Label>
              <Select value={form.policy_type} onChange={(e) => setForm({ ...form, policy_type: e.target.value })}>
                <option>Family Floater</option>
                <option>Individual</option>
                <option>Senior Citizen</option>
                <option>Group / Corporate</option>
                <option>Critical Illness</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sum insured (₹)</Label>
                <Input type="number" min="0" value={form.sum_insured} onChange={(e) => setForm({ ...form, sum_insured: e.target.value })} placeholder="500000" />
              </div>
              <div>
                <Label>Valid till</Label>
                <Input type="date" value={form.valid_till} onChange={(e) => setForm({ ...form, valid_till: e.target.value })} />
              </div>
            </div>
            <Button
              type="submit"
              loading={loading}
              disabled={!doc || uploading}
              className="w-full"
              title={!doc ? "Upload your policy document to continue" : undefined}
            >
              Add policy
            </Button>
            {!doc && (
              <p className="text-center text-xs text-muted">
                Upload your policy document above to enable this button.
              </p>
            )}
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {policies.length === 0 ? (
            <EmptyState title="No policies yet" hint="Add your first insurance policy to start requesting quotes." />
          ) : (
            policies.map((p) => (
              <Card key={p.id} className="flex items-start justify-between p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{p.insurer}</p>
                    {p.policy_type && (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                        {p.policy_type}
                      </span>
                    )}
                    {p.document_id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
                        </svg>
                        Document attached
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Policy #{p.policy_number}
                  </p>
                  <div className="mt-3 flex gap-6 text-sm">
                    <span>
                      <span className="text-muted">Sum insured </span>
                      <span className="font-medium">{inr(p.sum_insured)}</span>
                    </span>
                    <span>
                      <span className="text-muted">Valid till </span>
                      <span className="font-medium">{formatDate(p.valid_till)}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="text-sm font-medium text-muted hover:text-danger"
                >
                  Remove
                </button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}