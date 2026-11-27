"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, GraduationCap, Mail, Pencil, Sparkles, Target, Wrench } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { formatDate, initials } from "@/lib/format";
import { apiRequest } from "@/lib/api";
import LoadError from "@/components/ui/LoadError";

// Dashboard - only visible to logged-in students.
// Readiness, roadmap progress and the checklist come from GET /api/dashboard (M6).
function DashboardContent() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changed by "Try again" to repeat the request
  const firstName = user.name.split(" ")[0];
  const skills = user.skills || [];

  // One request returns readiness, roadmap progress and the checklist (GET /api/dashboard).
  useEffect(() => {
    let active = true;
    apiRequest("/dashboard", { token })
      .then((data) => { if (active) { setSummary(data); setLoadError(""); } })
      .catch((err) => { if (active) setLoadError(err.message); });
    return () => { active = false; };
  }, [token, user.targetRole, user.skills, user.resume, reloadKey]);

  // "…" while the first request is running, "–" when there is no data yet (or it failed).
  const pending = !summary && !loadError;

  // Until the summary loads, show the checklist from the user data already in memory.
  const checklist = summary?.checklist ?? [
    { label: "Create your account", done: true },
    { label: "Complete your profile", done: user.profileComplete, href: "/profile" },
    { label: "Upload your resume", done: Boolean(user.resume), href: "/profile" },
    { label: "Choose a career goal", done: Boolean(user.targetRole), href: "/skill-gap" },
    { label: "Generate your learning roadmap", done: false, href: "/roadmap" },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const percent = Math.round((completed / checklist.length) * 100);
  const readiness = summary?.careerReadiness;
  const roadmap = summary?.roadmap;

  const stats = [
    {
      icon: Target,
      label: "Career readiness",
      value: pending ? "…" : readiness?.matchPercentage != null ? `${readiness.matchPercentage}%` : "–",
      note: readiness?.targetRole ? `Skill match for ${readiness.targetRole.title}` : "Choose a career goal first",
    },
    {
      icon: Wrench, label: "Skills added", value: skills.length,
      note: user.resume ? `${user.resume.detectedSkills.length} detected in your resume` : "Add skills or upload your resume",
    },
    {
      icon: CalendarDays, label: "Roadmap progress",
      value: pending ? "…" : roadmap ? `${roadmap.progress.percentage}%` : "–",
      note: !roadmap
        ? `Member since ${formatDate(user.createdAt)}`
        : roadmap.currentWeek
          ? `Week ${roadmap.currentWeek.week} of ${roadmap.totalWeeks}: ${roadmap.currentWeek.skill}`
          : "All tasks done",
    },
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

      {loadError && (
        <div className="mt-7">
          <LoadError
            message={summary
              ? `Your progress could not be refreshed, so the last loaded values are shown. ${loadError}`
              : `Your progress could not be loaded. ${loadError}`}
            onRetry={() => { setLoadError(""); setReloadKey((k) => k + 1); }} />
        </div>
      )}

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

        {/* Profile summary card (data from the Profile module) */}
        <section className="skeu-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">Your profile</h2>
            <Link href="/profile" className="skeu-btn skeu-btn-secondary flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <span className="skeu-appicon grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-extrabold text-white">
              <span className="skeu-engrave relative z-10">{initials(user.name)}</span>
            </span>
            <div className="min-w-0">
              <p className="skeu-emboss truncate font-bold text-[#2a2733]">{user.name}</p>
              <p className="skeu-emboss flex items-center gap-1.5 truncate text-sm text-[#6b6476]">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {user.email}
              </p>
            </div>
          </div>
          <div className="skeu-well mt-5 flex gap-3 p-4 text-sm">
            <GraduationCap className="h-5 w-5 shrink-0 text-[#4639d6]" aria-hidden="true" />
            {user.profileComplete ? (
              <div className="min-w-0">
                <p className="skeu-emboss font-bold text-[#2a2733]">{user.degree}</p>
                <p className="skeu-emboss text-[#6b6476]">
                  {user.university}{user.graduationYear ? ` · Class of ${user.graduationYear}` : ""}
                </p>
              </div>
            ) : (
              <p className="skeu-emboss text-[#6b6476]">Add your university and degree on the profile page.</p>
            )}
          </div>
          <p className="skeu-emboss mt-5 text-sm font-bold text-[#3b3646]">Skills ({skills.length})</p>
          {skills.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {skills.slice(0, 12).map((s) => (
                <li key={s} className="skeu-chip rounded-full px-2.5 py-0.5 text-xs font-semibold">{s}</li>
              ))}
              {skills.length > 12 && (
                <li className="skeu-emboss px-1 py-0.5 text-xs font-semibold text-[#6b6476]">+{skills.length - 12} more</li>
              )}
            </ul>
          ) : (
            <p className="skeu-emboss mt-1 text-sm italic text-[#8d8577]">No skills yet.</p>
          )}
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
