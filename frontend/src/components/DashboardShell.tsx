"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  clearSession,
  getSession,
  type Role,
  type Session,
} from "@/lib/api";
import { Logo } from "@/components/ui";
import UserDetailPanel from "@/components/UserDetailPanel";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ic = "h-5 w-5";
export const Icons = {
  home: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z" />
    </svg>
  ),
  policy: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V6l-8-3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  ),
  rx: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h6a3 3 0 0 1 0 6H6V4Zm0 6v10m4 0 7-7m-4 0 4 4" />
    </svg>
  ),
  quote: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2V4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 13h4" />
    </svg>
  ),
  inbox: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4l2 3h6l2-3h4M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
    </svg>
  ),
  hospital: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V8l8-5 8 5v13M9 21v-5h6v5M12 7v4m-2-2h4" />
    </svg>
  ),
  users: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m13-9a3 3 0 1 0 0-6m5 11v-1a4 4 0 0 0-3-3.9M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  ),
  building: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2" />
    </svg>
  ),
  profile: (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
    </svg>
  ),
  panelClose: () => (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4V5Zm5 0v14m7-10-3 3 3 3" />
    </svg>
  ),
  panelOpen: () => (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4V5Zm5 0v14m5-10 3 3-3 3" />
    </svg>
  ),
  moon: () => (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" />
    </svg>
  ),
  sun: () => (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  ),
  signOut: () => (
    <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2m-4-5h9m0 0-3-3m3 3-3 3" />
    </svg>
  ),
};

export default function DashboardShell({
  role,
  nav,
  children,
}: {
  role: Role;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const [showUserPanel, setShowUserPanel] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== role) {
      router.replace(`/login?role=${role}`);
      return;
    }
    Promise.resolve().then(() => {
      setSession(s);
      setReady(true);
    });
  }, [role, router]);

  useEffect(() => {
    const savedSidebar = localStorage.getItem("dashboard_sidebar_collapsed");
    const savedTheme = localStorage.getItem("dashboard_theme");
    Promise.resolve().then(() => {
      setSidebarCollapsed(savedSidebar === "true");
      setTheme(savedTheme === "dark" ? "dark" : "light");
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("dashboard_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("dashboard_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  function logout() {
    clearSession();
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    router.replace("/");
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const roleLabel =
    role === "patient" ? "Patient" : role === "hospital" ? "Hospital" : "Tech / Admin";
  const homeHref = `/${role}`;
  const iconButton =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-20" : "w-64"
          }`}
      >
        <div
          className={`flex h-16 items-center border-b border-border ${sidebarCollapsed ? "justify-center px-3" : "gap-2.5 px-4"
            }`}
        >
          <Link
            href={homeHref}
            className={`flex min-w-0 items-center gap-2.5 rounded-lg transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${sidebarCollapsed ? "justify-center" : "flex-1"
              }`}
            title={`${roleLabel} home`}
          >
            <Logo size={28} />
            {!sidebarCollapsed && (
              <span className="truncate font-semibold tracking-tight">
                Medi<span className="text-primary">Connect</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            className={iconButton}
            aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? <Icons.panelOpen /> : <Icons.panelClose />}
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${sidebarCollapsed ? "p-3" : "p-4"}`}>
          {!sidebarCollapsed && (
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              {roleLabel}
            </p>
          )}
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } ${active
                    ? "bg-primary-soft text-primary-dark"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-border ${sidebarCollapsed ? "p-3" : "p-4"}`}>
          <button
            type="button"
            onClick={toggleTheme}
            className={`mb-2 flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground ${sidebarCollapsed ? "justify-center" : "gap-3 text-left"
              }`}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? <Icons.moon /> : <Icons.sun />}
            {!sidebarCollapsed && (
              <span>{theme === "light" ? "Dark theme" : "Light theme"}</span>
            )}
          </button>

          <div
            className={`flex items-center rounded-xl py-2 ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
              }`}
          >
            <button
              type="button"
              onClick={() => setShowUserPanel(true)}
              className="flex items-center"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
                aria-label="User profile"
              >
                {session.name.charAt(0).toUpperCase()}
              </div>
            </button>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.name}</p>
                <p className="truncate text-xs text-muted">{roleLabel}</p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className={`mt-2 flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-danger ${sidebarCollapsed ? "justify-center" : "gap-3 text-left"
              }`}
            aria-label="Sign out"
            title="Sign out"
          >
            <Icons.signOut />
            {!sidebarCollapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-5 lg:hidden">
          <Link href={homeHref} className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-semibold">MediConnect</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={iconButton}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? <Icons.moon /> : <Icons.sun />}
            </button>
            <button
              onClick={logout}
              className="text-sm font-medium text-muted hover:text-danger"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-4 py-2 lg:hidden">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-primary-soft text-primary-dark" : "text-muted"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      {/* User detail panel modal */}
      {showUserPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6">
            <UserDetailPanel role={role} />
            <button
              type="button"
              onClick={() => setShowUserPanel(false)}
              className="mt-4 w-full rounded-xl bg-primary py-2 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}