"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { Icons } from "@/components/DashboardShell";

const nav = [
  { href: "/hospital", label: "Overview", icon: Icons.home },
  { href: "/hospital/requests", label: "Quote requests", icon: Icons.inbox },
  { href: "/hospital/quotes", label: "Quotes issued", icon: Icons.quote },
  { href: "/hospital/profile", label: "Hospital profile", icon: Icons.building },
];

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="hospital">
      <DashboardShell role="hospital" nav={nav}>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
