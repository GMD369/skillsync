"use client";

import { CheckCircle2, CircleDashed } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProfileDetailsCard from "@/components/profile/ProfileDetailsCard";
import SkillsCard from "@/components/profile/SkillsCard";
import ResumeCard from "@/components/profile/ResumeCard";
import { useAuth } from "@/context/AuthContext";

// Profile & Resume module (M2) - connected to the AI Resume Analyzer (M3).
function ProfileContent() {
  const { user } = useAuth();
  const steps = [
    { label: "Education details", done: user.profileComplete },
    { label: "Skills added", done: user.skills.length > 0 },
    { label: "Resume uploaded", done: Boolean(user.resume) },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="skeu-emboss text-3xl font-extrabold tracking-tight text-[#2a2733]">Your profile</h1>
          <p className="skeu-emboss mt-1 text-[#5d5768]">
            Tell SkillSync about yourself so it can find your skill gaps.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {steps.map((s) => (
            <li key={s.label}
              className={`skeu-badge ${s.done ? "skeu-badge-green" : "skeu-badge-amber"} flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold`}>
              {s.done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />}
              {s.label}
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ProfileDetailsCard />
        <SkillsCard />
        <div className="lg:col-span-2">
          <ResumeCard />
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
