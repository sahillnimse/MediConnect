"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Logo, Wordmark } from "@/components/ui";
import UploadCard from "@/components/UploadCard";
import { getSession, clearSession, type Session, API_BASE } from "@/lib/api";
import { useRouter } from "next/navigation";

/* ── Small presentational helpers ──────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
          <path d="m10 1.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5Z" />
        </svg>
      ))}
    </span>
  );
}

const STEPS = [
  { t: "Upload Policy", d: "Upload a clear copy of your medical insurance policy.", icon: "M12 16V8m0 0L9 11m3-3 3 3M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" },
  { t: "We Find Hospitals", d: "We show you network hospitals in your area.", icon: "m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" },
  { t: "Send Enquiry", d: "Send your policy to selected hospitals for treatment estimate.", icon: "M4 12 20 4l-6 16-3-7-7-1Z" },
  { t: "Get Responses", d: "Hospitals will reply with package details and estimated cost.", icon: "M8 12h8M8 8h8m-8 8h4m6-4a8 8 0 0 1-8 8H7l-3 3v-3a8 8 0 0 1 8-15 8 8 0 0 1 8 7Z" },
];

const STATS = [
  { v: "250+", l: "Partner Hospitals", icon: "M4 21V8l8-5 8 5v13M9 21v-5h6v5" },
  { v: "50,000+", l: "Patient Enquiries", icon: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m13-9a3 3 0 1 0 0-6M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  { v: "98%", l: "Patient Satisfaction", icon: "M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-3V8a6 6 0 0 0-12 0v4" },
  { v: "24 Hrs", l: "Average Response Time", icon: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
];

const SUCCESS_STORIES = [
  {
    initials: "R.S.",
    city: "Mumbai, Maharashtra",
    treatment: "Cardiac Bypass Surgery",
    hospital: "Apollo Hospitals, Mumbai",
    outcome: "Fully recovered in 6 weeks",
    quote: "MediConnect helped me find the right hospital within hours. My insurer covered 90% and the hospital team was exceptional.",
    rating: 5,
    tag: "Cardiology",
  },
  {
    initials: "P.M.",
    city: "Ahmedabad, Gujarat",
    treatment: "Knee Replacement",
    hospital: "Fortis Hospital, Ahmedabad",
    outcome: "Walking pain-free after 8 weeks",
    quote: "I was worried about costs, but MediConnect's quote system made everything transparent. Back to my morning walks!",
    rating: 5,
    tag: "Orthopaedics",
  },
  {
    initials: "A.K.",
    city: "Bengaluru, Karnataka",
    treatment: "Laparoscopic Appendectomy",
    hospital: "Manipal Hospital, Bengaluru",
    outcome: "Discharged within 48 hours",
    quote: "Same-day estimate, surgery the next morning. I couldn't believe how smooth the process was through MediConnect.",
    rating: 5,
    tag: "General Surgery",
  },
  {
    initials: "S.N.",
    city: "Kochi, Kerala",
    treatment: "Chemotherapy & Oncology",
    hospital: "Amrita Hospital, Kochi",
    outcome: "In remission — 2 years cancer-free",
    quote: "Finding an oncology specialist who accepted my policy used to feel impossible. MediConnect changed that for me.",
    rating: 5,
    tag: "Oncology",
  },
  {
    initials: "V.R.",
    city: "Jaipur, Rajasthan",
    treatment: "Cataract Surgery (Both Eyes)",
    hospital: "Sawai Man Singh Hospital, Jaipur",
    outcome: "20/20 vision restored",
    quote: "The hospital responded within hours with a full cost breakdown. Zero surprises at discharge — exactly what I needed.",
    rating: 5,
    tag: "Ophthalmology",
  },
  {
    initials: "N.G.",
    city: "Indore, Madhya Pradesh",
    treatment: "High-Risk Maternity Care",
    hospital: "Bombay Hospital, Indore",
    outcome: "Healthy mother and baby",
    quote: "My gynaecologist recommended MediConnect during my high-risk pregnancy. The support was outstanding throughout.",
    rating: 5,
    tag: "Maternity",
  },
];

const NETWORK_HOSPITALS = [
  {
    name: "Apollo Hospitals",
    city: "Pan-India Network",
    specialty: "Multi-Specialty · Cardiology · Neurology",
    img: "https://images.unsplash.com/photo-1587351021759-3e566b3db4f1?w=600&q=80",
    beds: "10,000+",
    tag: "Platinum Partner",
  },
  {
    name: "Fortis Healthcare",
    city: "25 Cities Across India",
    specialty: "Oncology · Orthopaedics · Transplants",
    img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    beds: "4,000+",
    tag: "Gold Partner",
  },
  {
    name: "Manipal Hospitals",
    city: "Bengaluru & South India",
    specialty: "Robotic Surgery · Paediatrics · ICU",
    img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
    beds: "5,000+",
    tag: "Gold Partner",
  },
  {
    name: "Narayana Health",
    city: "Nationwide Network",
    specialty: "Cardiac Care · Dialysis · Emergency",
    img: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&q=80",
    beds: "6,000+",
    tag: "Platinum Partner",
  },
  {
    name: "Aster Hospitals",
    city: "South & West India",
    specialty: "Liver Transplant · Dermatology · ENT",
    img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80",
    beds: "2,500+",
    tag: "Silver Partner",
  },
  {
    name: "Kokilaben Hospital",
    city: "Mumbai, Maharashtra",
    specialty: "Spine Surgery · Oncology · IVF",
    img: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&q=80",
    beds: "750+",
    tag: "Gold Partner",
  },
];

const PARTNER_BADGE_COLOR: Record<string, string> = {
  "Platinum Partner": "bg-violet-100 text-violet-700",
  "Gold Partner": "bg-amber-100 text-amber-700",
  "Silver Partner": "bg-slate-100 text-slate-600",
};

/* ── User profile dropdown ─────────────────────────────────────────────── */
function UserMenu({ session, theme, onToggleTheme }: { session: Session; theme: string; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function openProfile() {
    setOpen(false);
    try {
      let endpoint = session.role === "hospital" ? "/api/hospital/profile" : "/api/patient/me";
      if (session.role === "admin") endpoint = "";
      if (endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (res.ok) setProfile(await res.json());
      }
    } catch { }
    setShowProfile(true);
  }

  function logout() {
    clearSession();
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    router.replace("/");
    setOpen(false);
  }

  const roleLabel = session.role === "patient" ? "Patient" : session.role === "hospital" ? "Hospital" : "Admin";
  const dashHref = `/${session.role}`;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          aria-label="User menu"
        >
          {session.name.charAt(0).toUpperCase()}
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-semibold">{session.name}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
            <div className="py-1">
              <button
                onClick={openProfile}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
              >
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
                </svg>
                My Profile
              </button>
              <Link
                href={dashHref}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
                onClick={() => setOpen(false)}
              >
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z" />
                </svg>
                Dashboard
              </Link>
              <button
                onClick={onToggleTheme}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
              >
                {theme === "light" ? (
                  <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  </svg>
                )}
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>
            </div>
            <div className="border-t border-border py-1">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-surface-muted"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2m-4-5h9m0 0-3-3m3 3-3 3" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">My Profile</h2>
              <button onClick={() => setShowProfile(false)} className="text-muted hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-white">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-lg">{session.name}</p>
                <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-dark capitalize">
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {session.role === "patient" && profile && (
                <>
                  <ProfileRow label="Email" value={profile.email} />
                  <ProfileRow label="Phone" value={profile.phone} />
                  <ProfileRow label="Address" value={profile.city} />
                  <ProfileRow label="Age / DOB" value={profile.dob} />
                  <ProfileRow label="Blood Group" value={profile.blood_group} />
                </>
              )}
              {session.role === "hospital" && profile && (
                <>
                  <ProfileRow label="Email" value={profile.email} />
                  <ProfileRow label="Phone" value={profile.phone} />
                  <ProfileRow label="Address" value={profile.city} />
                  <ProfileRow label="Specialties" value={profile.specialties} />
                  <ProfileRow label="Status" value={profile.status} />
                </>
              )}
              {session.role === "admin" && (
                <>
                  <ProfileRow label="Email" value={session.email ?? "admin@connector.io"} />
                  <ProfileRow label="Role" value="Platform Administrator" />
                </>
              )}
            </div>

            <button
              onClick={() => setShowProfile(false)}
              className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between border-t border-border pt-3 first:border-0 first:pt-0">
      <span className="text-muted w-28 shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

/* ── Theme toggle button ───────────────────────────────────────────────── */
function ThemeToggle({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-muted hover:text-foreground"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        </svg>
      )}
    </button>
  );
}

/* ── Success story card ────────────────────────────────────────────────── */
function StoryCard({ s }: { s: typeof SUCCESS_STORIES[0] }) {
  return (
    <div className="card flex flex-col gap-4 p-6">
      <span className="inline-flex w-fit rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
        {s.tag}
      </span>
      <blockquote className="text-sm leading-relaxed text-muted flex-1">
        <span className="text-2xl font-serif text-primary leading-none mr-1">"</span>
        {s.quote}
        <span className="text-2xl font-serif text-primary leading-none ml-1">"</span>
      </blockquote>
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
        {s.outcome}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
            {s.initials.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold">{s.initials} — <span className="font-normal text-muted">{s.city}</span></p>
            <p className="text-xs text-muted">{s.treatment}</p>
          </div>
        </div>
        <Stars rating={s.rating} />
      </div>
      <p className="text-xs text-muted flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V8l8-5 8 5v13M9 21v-5h6v5" />
        </svg>
        {s.hospital}
      </p>
    </div>
  );
}

/* ── Hospital showcase card ────────────────────────────────────────────── */
function HospitalCard({ h }: { h: typeof NETWORK_HOSPITALS[0] }) {
  return (
    <div className="card group overflow-hidden p-0">
      <div className="relative h-44 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={h.img}
          alt={h.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${PARTNER_BADGE_COLOR[h.tag]}`}>
          {h.tag}
        </span>
      </div>
      <div className="p-4">
        <p className="font-semibold leading-tight">{h.name}</p>
        <p className="mt-0.5 text-xs text-muted flex items-center gap-1">
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {h.city}
        </p>
        <p className="mt-2 text-xs text-muted">{h.specialty}</p>
        <p className="mt-2 text-xs font-medium text-primary">{h.beds} bed capacity</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setSession(getSession());
    const saved = localStorage.getItem("dashboard_theme");
    const t = saved === "dark" ? "dark" : "light";
    setTheme(t);
    document.documentElement.dataset.theme = t;
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("dashboard_theme", next);
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">

      {/* ══ NAV — single, clean, no duplicates ══════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        {/*
          Inner wrapper: px-6 horizontal padding, py-2 vertical (slimmer than before).
          Three children: logo (shrink-0 left), nav (absolute center), actions (shrink-0 right).
          Using relative + absolute centering so the nav is truly centered regardless of
          logo/button widths being unequal.
        */}
        <div className="relative flex items-center px-6 py-2">

          {/* LEFT — Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 z-10">
            <Logo />
            <span>
              <Wordmark />
              <span className="block text-[11px] font-medium text-muted leading-none">
                Your Health. Our Priority.
              </span>
            </span>
          </Link>

          {/* CENTER — Nav links (absolutely centered in the bar) */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-sm font-medium">
            <a href="#" className="text-foreground">Home</a>
            <a href="#how" className="text-muted hover:text-foreground transition-colors">How It Works</a>
            <a href="#stories" className="text-muted hover:text-foreground transition-colors">Success Stories</a>
            <a href="#hospitals" className="text-muted hover:text-foreground transition-colors">Hospitals</a>
            <a href="#contact" className="text-muted hover:text-foreground transition-colors">Contact Us</a>
          </nav>

          {/* RIGHT — Theme toggle + auth only (no duplicate login/signup) */}
          <div className="flex items-center gap-2 ml-auto z-10">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            {session ? (
              <UserMenu session={session} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
                >
                  Login
                </Link>
                <Link
                  href="/register/patient"
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </div>
      </header>
      {/* ══ END NAV ══════════════════════════════════════════════════════ */}

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1664393487215-a7d7c7385fb3?w=1800&q=80"
          alt="Happy family — mother, father and child playing outdoors"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "left center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1e3f]/90 via-[#0b1e3f]/60 to-[#0b1e3f]/20" />

        <div className="relative w-full">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:py-28">

            {/* Left — headline */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-white/20 mb-5">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.7 6.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4l2.3 2.3 6.3-6.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                </svg>
                Trusted by 50,000+ patients across India
              </span>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-6xl">
                Find the Right Hospital.
                <br />
                <span className="text-blue-300">Get the Right Treatment.</span>
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
                Upload your insurance policy — we instantly match you with network hospitals
                that accept your insurer and can perform your procedure.{" "}
                <span className="font-semibold text-white">100% free for patients.</span>
              </p>

              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                {[
                  { t: "100% Free", s: "for Patients", icon: "M12 8c-1.5 0-3 .9-3 2.5S10.5 13 12 13s3 .9 3 2.5S13.5 18 12 18m0-10V6m0 12v2" },
                  { t: "Secure &", s: "Private", icon: "M12 3 4 6v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V6l-8-3Z" },
                  { t: "Quick", s: "Responses", icon: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
                ].map((f) => (
                  <div key={f.t} className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-blue-200 ring-1 ring-white/20">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold leading-tight text-white">
                      {f.t}
                      <span className="block font-normal text-slate-300">{f.s}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register/patient" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark">
                  Get Started Free →
                </Link>
                <a href="#how" className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right — upload card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <UploadCard />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">How It Works</h2>
        <div className="mt-12 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-2">
          {STEPS.map((s, i) => (
            <div key={s.t} className="relative flex flex-col items-center px-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </span>
              <h3 className="mt-4 font-semibold">{`${i + 1}. ${s.t}`}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SUCCESS STORIES ═════════════════════════════════════════════ */}
      <section id="stories" className="bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">Patient Success Stories</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Real Recoveries, Real Impact</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Thousands of patients have found the right care through MediConnect. Here are a few of their journeys — shared with permission, identities protected.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SUCCESS_STORIES.map((s) => (
              <StoryCard key={s.initials + s.treatment} s={s} />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-border bg-surface p-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">4.9 / 5</p>
              <p className="mt-0.5 text-xs text-muted">Average patient rating</p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-primary">12,400+</p>
              <p className="mt-0.5 text-xs text-muted">Successful treatments facilitated</p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-primary">₹340 Cr+</p>
              <p className="mt-0.5 text-xs text-muted">Insurance claims settled</p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="mt-0.5 text-xs text-muted">Would recommend MediConnect</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ NETWORK HOSPITALS ═══════════════════════════════════════════ */}
      <section id="hospitals" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-2 flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V8l8-5 8 5v13M9 21v-5h6v5" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Our Network</span>
        </div>
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Partner Hospitals</h2>
          <Link href="/register/patient" className="hidden sm:inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark">
            Find a Hospital →
          </Link>
        </div>
        <p className="mt-3 max-w-2xl text-muted">
          We partner with India's most trusted hospital groups — all verified, NABH-accredited, and ready to serve you.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NETWORK_HOSPITALS.map((h) => (
            <HospitalCard key={h.name} h={h} />
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          + 200 more hospitals across 30 cities ·{" "}
          <Link href="/register/hospital" className="text-primary hover:underline">
            Join as a hospital partner →
          </Link>
        </p>
      </section>

      {/* ══ SMART POLICY MATCHING CALLOUT ═══════════════════════════════ */}
      <section className="bg-gradient-to-r from-primary to-[#1d4ed8] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-4">
                Smart Policy Matching
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                We Read Your Policy.<br />You Get Matched Hospitals.
              </h2>
              <p className="mt-4 text-blue-100 leading-relaxed">
                Upload your health insurance policy and our system automatically identifies
                which hospitals in our network are empanelled with your insurer, support
                cashless claims, and have the facilities for your specific treatment.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "M12 3 4 6v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V6l-8-3Zm0 5v4m0 3v.5", title: "Policy Verified", desc: "We match your insurer against hospital empanelment lists" },
                { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138", title: "NABH Hospitals", desc: "Only verified, accredited hospitals appear in results" },
                { icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z", title: "Cashless Available", desc: "See which hospitals offer cashless settlement for your policy" },
                { icon: "M12 6v12m-3-2.818.879.659 3 1.5a2.501 2.501 0 0 0 2.242 0l3-1.5.879-.659M2.929 7.929A10 10 0 0 1 12 2a10 10 0 1 1-9.071 5.929Z", title: "Cost Breakdown", desc: "Get surgery cost, room charges, and out-of-pocket estimates" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <svg className="h-6 w-6 text-blue-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-blue-200 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
      <footer id="contact" className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={30} />
              <Wordmark size="text-base" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              MediConnect bridges the gap between patients and hospitals by
              simplifying insurance-based treatment enquiries.
            </p>
          </div>
          {[
            { h: "For Patients", links: ["How It Works", "Find Hospitals", "Common Treatments", "FAQs"] },
            { h: "For Hospitals", links: ["Become a Partner", "Hospital Dashboard", "Pricing & Plans", "Resources"] },
            { h: "Company", links: ["About Us", "Contact Us", "Privacy Policy", "Terms & Conditions"] },
          ].map((col) => (
            <div key={col.h}>
              <p className="font-semibold">{col.h}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-sm text-muted">
            <span>© 2026 MediConnect. All rights reserved.</span>
            <span className="hidden sm:block text-xs">
              Patient data is protected under applicable privacy laws. No personal information is displayed publicly.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}