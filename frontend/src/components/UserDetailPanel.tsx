"use client";

import { Card } from "@/components/ui";
import { getSession, type Role, type Session, api, API_BASE } from "@/lib/api";
import { useEffect, useState } from "react";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between border-t border-border pt-3 first:border-0 first:pt-0">
      <span className="text-xs text-muted w-28 shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function UserDetailPanel({ role }: { role: Role }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (!s) return;

    if (role === "hospital") {
      api("/api/hospital/profile").then(setProfile).catch(() => {});
    } else if (role === "patient") {
      api("/api/patient/me").then(setProfile).catch(() => {});
    }
  }, [role]);

  if (!session) return null;

  const initial = session.name?.charAt(0).toUpperCase() ?? "?";
  const roleLabel =
    role === "patient" ? "Patient" : role === "hospital" ? "Hospital" : "Platform Admin";

  return (
    <Card className="p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
          {initial}
        </div>
        <div>
          <p className="font-semibold">{session.name}</p>
          <span className="inline-flex mt-0.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-dark">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3 text-sm">
        {role === "patient" && profile && (
          <>
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Address / City" value={profile.city} />
            <Row label="Age / DOB" value={profile.dob} />
            <Row label="Blood Group" value={profile.blood_group} />
          </>
        )}

        {role === "hospital" && profile && (
          <>
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Address" value={profile.city} />
            <Row label="Specialties" value={profile.specialties} />
            <Row label="Status" value={profile.status} />
          </>
        )}

        {role === "admin" && (
          <>
            <Row label="Email" value={session.email ?? "admin@connector.io"} />
            <Row label="Access Level" value="Full platform access" />
          </>
        )}
      </div>
    </Card>
  );
}
