"use client";

import { useEffect, useState } from "react";
import { Clock, FolderGit2, Target } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import LoadError from "@/components/ui/LoadError";

const LEVELS = [
  { value: "", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Project recommendations page (M7, FR-13): GET /api/recommendations/projects
function ProjectsContent() {
  const { token } = useAuth();
  const [level, setLevel] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false); // true while a new filter is loading
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ limit: "9", ...(level && { level }) });
    apiRequest(`/recommendations/projects?${query}`, { token })
      .then((res) => { if (active) { setData(res); setError(null); } })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setUpdating(false));
    return () => { active = false; };
  }, [token, level, reloadKey]);

  const chooseLevel = (value) => {
    if (value === level) return;
    setUpdating(true);
    setLevel(value);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="skeu-badge skeu-badge-indigo inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
            <FolderGit2 className="h-3.5 w-3.5" aria-hidden="true" /> M7 &middot; Project Ideas
          </span>
          <h1 className="skeu-emboss mt-4 text-3xl font-extrabold tracking-tight text-[#2a2733]">Portfolio projects for you</h1>
          <p className="skeu-emboss mt-2 max-w-2xl text-[#5d5768]">
            {data?.basedOn.targetRole
              ? `Ranked by how many of your missing ${data.basedOn.targetRole} skills each project practises.`
              : "Projects that build on the skills you already have. Choose a career goal for better suggestions."}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl p-1" role="group" aria-label="Filter by level">
          {LEVELS.map((l) => (
            <button key={l.value} type="button" onClick={() => chooseLevel(l.value)} aria-pressed={level === l.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${level === l.value ? "skeu-tab-active" : "skeu-emboss text-[#4a4555]"}`}>
              {l.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="mt-6">
          <LoadError
            message={data
              ? `The list could not be updated, so the last loaded projects are shown. ${error}`
              : `Project ideas could not be loaded. ${error}`}
            onRetry={() => { setError(null); setUpdating(true); setReloadKey((k) => k + 1); }} />
        </div>
      )}
      {!data && !error && <p className="skeu-emboss mt-10 text-center text-[#6b6476]" role="status">Loading project ideas...</p>}

      {data && !data.basedOn.targetRole && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="sm" href="/skill-gap"><Target className="h-4 w-4" aria-hidden="true" /> Choose a career goal</Button>
        </div>
      )}

      {data && data.recommendations.length === 0 && (
        <section className="skeu-card mt-8 p-8 text-center">
          <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">No matching projects</h2>
          <p className="skeu-emboss mt-2 text-sm text-[#6b6476]">Try another level, or add more skills to your profile.</p>
        </section>
      )}

      {data && data.recommendations.length > 0 && (
        <>
          <p className="skeu-emboss mt-6 text-sm text-[#6b6476]">
            {updating ? "Updating..." : `Showing ${data.recommendations.length} of ${data.total} matching projects`}
          </p>
          <ul className={`mt-4 grid gap-5 transition-opacity md:grid-cols-2 lg:grid-cols-3 ${updating ? "opacity-50" : ""}`}
            aria-busy={updating}>
            {data.recommendations.map(({ project, match }) => (
              <li key={project.id} className="skeu-card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="skeu-emboss text-lg font-bold leading-snug text-[#2a2733]">{project.title}</h2>
                  <span className="skeu-badge skeu-badge-indigo shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize">
                    {project.level}
                  </span>
                </div>
                <p className="skeu-emboss mt-2 text-sm text-[#5d5768]">{project.description}</p>

                {match.practisesMissingSkills.length > 0 && (
                  <div className="mt-4">
                    <p className="skeu-emboss text-xs font-bold uppercase tracking-wide text-[#8d8577]">Practises (missing)</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {match.practisesMissingSkills.map((s) => (
                        <li key={s} className="skeu-badge skeu-badge-amber rounded-full px-2.5 py-0.5 text-xs font-bold">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {match.usesYourSkills.length > 0 && (
                  <div className="mt-3">
                    <p className="skeu-emboss text-xs font-bold uppercase tracking-wide text-[#8d8577]">Uses your skills</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {match.usesYourSkills.map((s) => (
                        <li key={s} className="skeu-badge skeu-badge-green rounded-full px-2.5 py-0.5 text-xs font-bold">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <ul className="skeu-well mt-4 space-y-1 px-4 py-3 text-xs text-[#4a4555]">
                  {project.features.map((f) => <li key={f} className="skeu-emboss">&bull; {f}</li>)}
                </ul>
                <p className="skeu-emboss mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-[#8d8577]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" /> About {project.estimatedHours} hours
                  &middot; you already know {match.readyPercentage}% of the skills
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default function ProjectsPage() {
  return <ProtectedRoute><ProjectsContent /></ProtectedRoute>;
}
