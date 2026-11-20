"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Mail, ShieldCheck, Sparkles, Target, Wrench } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

// Dashboard - only visible to logged-in students.
// The readiness score and roadmap progress will be filled in by later modules (M4-M6).
function DashboardContent() {
  const { user } = useAuth();
  const firstName = user.name.split(" ")[0];
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

  const checklist = [
    { label: "Create your account", done: true },
    { label: "Complete your profile", done: Boolean(user.education), href: "/profile" },
    { label: "Upload your resume", done: Boolean(user.resumeUrl), href: "/profile" },
    { label: "Choose a career goal", done: Boolean(user.targetRole), href: "/skill-gap" },
    { label: "Generate your learning roadmap", done: false, href: "/roadmap" },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const percent = Math.round((completed / checklist.length) * 100);

  const stats = [
    { icon: Target, label: "Career readiness", value: "–", note: "Choose a career goal first" },
    { icon: Wrench, label: "Skills added", value: user.skills?.length || 0, note: "From profile and resume" },
    { icon: CalendarDays, label: "Member since", value: joined, note: "Welcome to SkillSync" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      {/* Glossy welcome banner */}
      <section className="skeu-gloss rounded-2xl p-8">
        <div className="relative z-10">
          <p className="skeu-engrave flex items-center gap-2 text-sm font-semibold text-indigo-100">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Your career journey
          </p>
          <h1 className="skeu-engrave mt-2 text-3xl font-extrabold tracking-tight">Welcome, {firstName}!</h1>
          <p className="skeu-engrave mt-2 max-w-xl text-indigo-100">
            You are logged in. Complete the steps below to get your personalized skill gap report and roadmap.
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <section className="mt-7 grid gap-5 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, note }) => (
          <div key={label} className="skeu-card p-5">
            <div className="flex items-center justify-between">
              <p className="skeu-emboss text-sm font-semibold text-[#6b6476]">{label}</p>
              <span className="skeu-tile grid h-10 w-10 place-items-center rounded-xl">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
            </div>
            <p className="skeu-emboss mt-3 text-2xl font-extrabold text-[#2a2733]">{value}</p>
            <p className="skeu-emboss mt-1 text-xs text-[#8d8577]">{note}</p>
          </div>
        ))}
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        {/* Getting started checklist */}
        <section className="skeu-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">Getting started</h2>
            <span className="skeu-badge skeu-badge-indigo rounded-full px-2.5 py-0.5 text-xs font-bold">
              {completed} of {checklist.length} done
            </span>
          </div>
          <div className="skeu-track mt-4 h-3.5" role="progressbar" aria-valuenow={percent}
            aria-valuemin={0} aria-valuemax={100} aria-label="Getting started progress">
            <div className="skeu-fill h-3.5 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <ul className="skeu-well mt-5 divide-y divide-black/5 px-4">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-3">
                  <span className={`${item.done ? "skeu-check-done" : "skeu-check"} grid h-6 w-6 place-items-center`}>
                    {item.done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className={`skeu-emboss ${item.done ? "text-[#9b9384] line-through" : "font-semibold text-[#3b3646]"}`}>
                    {item.label}
                  </span>
                </span>
                {!item.done && item.href && (
                  <Link href={item.href}
                    className="skeu-btn skeu-btn-secondary flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold">
                    Start <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Account card */}
        <section className="skeu-card p-6">
          <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">Your account</h2>
          <div className="mt-5 flex items-center gap-4">
            <span className="skeu-appicon grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-extrabold text-white">
              <span className="skeu-engrave relative z-10">{initials}</span>
            </span>
            <div className="min-w-0">
              <p className="skeu-emboss truncate font-bold text-[#2a2733]">{user.name}</p>
              <p className="skeu-emboss flex items-center gap-1.5 truncate text-sm text-[#6b6476]">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {user.email}
              </p>
            </div>
          </div>
          <div className="skeu-well mt-6 flex gap-3 p-4 text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#23a356]" aria-hidden="true" />
            <div>
              <p className="skeu-emboss font-bold text-[#2a2733]">Secure login</p>
              <p className="skeu-emboss mt-1 text-[#6b6476]">
                Your password is encrypted and your session is protected with a secure token.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
