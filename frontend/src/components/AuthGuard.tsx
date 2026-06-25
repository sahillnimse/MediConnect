"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/api";

interface AuthGuardProps {
  requiredRole: "admin" | "hospital" | "patient";
  children: React.ReactNode;
}

export default function AuthGuard({ requiredRole, children }: AuthGuardProps) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace(`/login?role=${requiredRole}`);
      return;
    }

    // Admins have access to all role‑specific sections
    if (session.role === "admin") {
      Promise.resolve().then(() => setVerified(true));
      return;
    }

    if (session.role !== requiredRole) {
      router.replace("/");
      return;
    }

    Promise.resolve().then(() => {
      setVerified(true);
    });
  }, [requiredRole, router]);

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <svg
          className="h-10 w-10 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Loading"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
