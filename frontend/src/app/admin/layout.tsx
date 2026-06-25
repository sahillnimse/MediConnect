"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { Icons } from "@/components/DashboardShell";

const nav = [
  { href: "/admin", label: "Overview", icon: Icons.home },
  { href: "/admin/hospitals", label: "Hospitals", icon: Icons.hospital },
  { href: "/admin/patients", label: "Patients", icon: Icons.users },
  { href: "/admin/requests", label: "All requests", icon: Icons.quote },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardShell role="admin" nav={nav}>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}