"use client";

import { useEffect, useState } from "react";
import { api, getSession } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  PageTitle,
  Textarea,
  useToast,
} from "@/components/ui";

interface Profile {
  name: string;
  email: string;
  city: string | null;
  phone: string | null;
  specialties: string | null;
  description: string | null;
  status: string;
  photo_url: string | null;  // ← added
}

export default function HospitalProfile() {
  const { toast, node } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false); // ← added

  useEffect(() => {
    api<Profile>("/api/hospital/profile").then(setProfile).catch(() => { });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await api("/api/hospital/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name,
          city: profile.city,
          phone: profile.phone,
          specialties: profile.specialties,
          description: profile.description,
        }),
      });
      toast("Profile updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Photo upload handler ─────────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setPhotoLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const session = getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/hospital/upload-photo`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.token}` },
          body: form,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }

      const data = await res.json();
      setProfile({ ...profile, photo_url: data.photo_url });
      toast("Photo uploaded successfully!");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setPhotoLoading(false);
      e.target.value = ""; // reset file input
    }
  }

  if (!profile) return <div className="h-40" />;

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfile({ ...profile, [k]: e.target.value });

  return (
    <div className="space-y-8">
      {node}
      <PageTitle title="Hospital Profile — MediConnect" />
      <div className="flex items-end justify-between">
        <PageHeader
          title="Hospital profile"
          subtitle="This is what patients see when choosing where to request a quote."
        />
        <Badge status={profile.status} />
      </div>

      <Card className="max-w-2xl p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Hospital name</Label>
            <Input value={profile.name} onChange={set("name")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} disabled className="opacity-60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>City</Label>
              <Input value={profile.city ?? ""} onChange={set("city")} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profile.phone ?? ""} onChange={set("phone")} />
            </div>
          </div>
          <div>
            <Label>Specialities</Label>
            <Input value={profile.specialties ?? ""} onChange={set("specialties")} placeholder="Cardiology, Oncology" />
          </div>
          <div>
            <Label>About the hospital</Label>
            <Textarea value={profile.description ?? ""} onChange={set("description")} />
          </div>

          {/* ── Photo upload — added below description ── */}
          <div>
            <Label>Hospital Photo</Label>

            {/* Show current photo if exists */}
            {profile.photo_url && (
              <div className="mb-3 overflow-hidden rounded-xl border border-border">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE}${profile.photo_url}`}
                  alt="Hospital photo"
                  className="h-48 w-full object-cover"
                />
                <p className="px-3 py-2 text-xs text-muted">Current photo · Upload a new one to replace it</p>
              </div>
            )}

            <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition hover:bg-surface-muted ${photoLoading ? "opacity-50 pointer-events-none" : ""}`}>
              {photoLoading ? (
                <>
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                  <span className="text-sm text-muted">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium">{profile.photo_url ? "Replace photo" : "Upload photo"}</span>
                  <span className="text-xs text-muted">JPG, PNG or WebP · Max 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          {/* ── End photo upload ── */}

          <Button type="submit" loading={loading}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}