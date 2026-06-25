"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { Icons } from "@/components/DashboardShell";

const nav = [
  { href: "/patient", label: "Overview", icon: Icons.home },
  { href: "/patient/policies", label: "Insurance policies", icon: Icons.policy },
  { href: "/patient/prescriptions", label: "Prescriptions", icon: Icons.rx },
  { href: "/patient/request", label: "Request a quote", icon: Icons.inbox },
  { href: "/patient/quotes", label: "My quotes", icon: Icons.quote },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="patient">
      <DashboardShell role="patient" nav={nav}>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
