"use client";

import React from "react";

// ── Button ────────────────────────────────────────────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  }[size];
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20",
    secondary: "bg-accent text-white hover:bg-slate-700",
    outline:
      "border border-border bg-surface text-foreground hover:bg-surface-muted",
    ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
    danger: "bg-danger text-white hover:bg-red-700",
  }[variant];
  return (
    <button
      className={`${base} ${sizes} ${variants} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}

// ── PageHeader ───────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}

export function PageTitle({ title }: { title: string }) {
  React.useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

// ── Field (label + input/textarea/select) ─────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

const fieldCx =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCx} ${props.className ?? ""}`} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`${fieldCx} resize-y min-h-[90px] ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldCx} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
const badgeTones: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  quoted: "bg-teal-50 text-teal-700 ring-teal-200",
  approved: "bg-green-50 text-green-700 ring-green-200",
  suspended: "bg-red-50 text-red-700 ring-red-200",
  declined: "bg-red-50 text-red-700 ring-red-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({ status }: { status: string }) {
  const tone = badgeTones[status] ?? badgeTones.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/50 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted">
          {icon}
        </div>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  );
}

// ── Toast (lightweight, no deps) ──────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = React.useState<{
    text: string;
    tone: "success" | "error";
  } | null>(null);
  React.useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div className="fixed bottom-6 right-6 z-50 animate-in">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
          msg.tone === "success" ? "bg-success" : "bg-danger"
        }`}
      >
        {msg.text}
      </div>
    </div>
  ) : null;
  return {
    toast: (text: string, tone: "success" | "error" = "success") =>
      setMsg({ text, tone }),
    node,
  };
}

// ── Logo mark ─────────────────────────────────────────────────────────────
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="mc-logo" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#mc-logo)" />
      <path
        d="M17.5 11h5v6.5H29v5h-6.5V29h-5v-6.5H11v-5h6.5V11Z"
        fill="white"
      />
    </svg>
  );
}

export function Wordmark({ size = "text-lg" }: { size?: string }) {
  return (
    <span className="leading-none">
      <span className={`block font-semibold tracking-tight ${size}`}>
        Medi<span className="text-primary">Connect</span>
      </span>
    </span>
  );
}
