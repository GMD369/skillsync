"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Save, Target, Wrench } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useSubmitLock } from "@/lib/useSubmitLock";
import LoadError from "@/components/ui/LoadError";

const statusStyle = {
  done: { label: "Done", badge: "skeu-badge-green", Icon: Check },
  in_progress: { label: "In progress", badge: "skeu-badge-amber", Icon: Wrench },
  missing: { label: "Missing", badge: "skeu-badge-red", Icon: CircleAlert },
};

function SkillGapContent() {
  const { user, token, updateUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(user.targetRole || "");
  const [gap, setGap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const lock = useSubmitLock();

  useEffect(() => {
    let active = true;
    const requests = [apiRequest("/career/roles")];
    if (user.targetRole) requests.push(apiRequest("/career/skill-gap", { token }));
    Promise.all(requests)
      .then(([roleData, gapData]) => {
        if (!active) return;
        setRoles(roleData.roles);
        if (gapData) setGap(gapData);
        setLoadError("");
      })
      .catch((err) => active && setLoadError(`Career roles could not be loaded. ${err.message}`))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token, user.targetRole, reloadKey]);

  const retry = () => {
    setLoading(true);
    setLoadError("");
    setReloadKey((k) => k + 1);
  };

  const analyze = () => lock(async () => {
    if (!selected) return setError("Choose one career role to continue.");
    setSaving(true);
    setError("");
    try {
      const saved = await apiRequest("/career/target-role", {
        method: "PUT", token, body: { roleId: selected },
      });
      updateUser(saved.user);
      setGap(await apiRequest("/career/skill-gap", { token }));
    } catch (err) {
      setError(err.errors?.roleId || err.message);
    } finally {
      setSaving(false);
    }
  });

  if (loading) return <p className="skeu-emboss p-8 text-center text-[#6b6476]" role="status">Loading career roles...</p>;

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <LoadError message={loadError} onRetry={retry} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header>
        <span className="skeu-badge skeu-badge-indigo inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
          <Target className="h-3.5 w-3.5" aria-hidden="true" /> M4 &middot; Career &amp; Skill Gap
        </span>
        <h1 className="skeu-emboss mt-4 text-3xl font-extrabold tracking-tight text-[#2a2733]">Choose your career goal</h1>
        <p className="skeu-emboss mt-2 max-w-2xl text-[#5d5768]">
          SkillSync compares your saved skills with the requirements of your selected role and shows what to learn next.
        </p>
      </header>

      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      <section className="mt-8">
        <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">1. Select a target role</h2>
        {roles.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Career roles">
            {roles.map((role) => {
              const checked = selected === role.id;
              return (
                <button key={role.id} type="button" role="radio" aria-checked={checked}
                  onClick={() => { setSelected(role.id); setError(""); }}
                  className={`skeu-card p-5 text-left transition ${checked ? "ring-2 ring-[#5246e6] ring-offset-2 ring-offset-[#e8e2d6]" : "hover:-translate-y-0.5"}`}>
                  <span className={`${checked ? "skeu-check-done" : "skeu-check"} grid h-7 w-7 place-items-center`}>
                    {checked && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <h3 className="skeu-emboss mt-4 font-bold text-[#2a2733]">{role.title}</h3>
                  <p className="skeu-emboss mt-1.5 text-sm leading-relaxed text-[#6b6476]">{role.description}</p>
                  <p className="skeu-emboss mt-3 text-xs font-semibold text-[#4639d6]">{role.requiredSkills.length} required skills</p>
                </button>
              );
            })}
          </div>
        ) : (
          <Alert variant="info">No career roles are available yet. Run the backend career-role seed command.</Alert>
        )}
        <Button className="mt-5" onClick={analyze} loading={saving} disabled={!selected || !roles.length}>
          {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? "Analyzing..." : gap ? "Update goal & analyze" : "Save goal & analyze skills"}
        </Button>
      </section>

      {gap && (
        <section className="mt-10" aria-live="polite">
          <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">2. Your skill-gap report</h2>
          <div className="skeu-gloss mt-4 rounded-2xl p-7 text-white">
            <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="skeu-engrave text-sm font-semibold text-indigo-100">Target role</p>
                <h3 className="skeu-engrave mt-1 text-2xl font-extrabold">{gap.role.title}</h3>
                <p className="skeu-engrave mt-1 text-sm text-indigo-100">
                  {gap.summary.done} of {gap.summary.total} required skills matched
                </p>
              </div>
              <div className="text-right">
                <p className="skeu-engrave text-sm font-semibold text-indigo-100">Career match</p>
                <p className="skeu-engrave text-4xl font-extrabold">{gap.summary.matchPercentage}%</p>
              </div>
            </div>
            <div className="skeu-track relative z-10 mt-5 h-3.5" role="progressbar"
              aria-label="Career skill match" aria-valuenow={gap.summary.matchPercentage} aria-valuemin={0} aria-valuemax={100}>
              <div className="skeu-fill h-3.5 transition-all" style={{ width: `${gap.summary.matchPercentage}%` }} />
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="skeu-card p-6 lg:col-span-2">
              <h3 className="skeu-emboss font-bold text-[#2a2733]">Required skills</h3>
              <ul className="skeu-well mt-4 divide-y divide-black/5 px-4">
                {gap.skills.map((skill) => {
                  const status = statusStyle[skill.status];
                  const Icon = status.Icon;
                  return (
                    <li key={skill.name} className="flex items-center justify-between gap-3 py-3.5">
                      <div>
                        <p className="skeu-emboss font-semibold text-[#3b3646]">{skill.name}</p>
                        <p className="skeu-emboss text-xs capitalize text-[#8d8577]">{skill.level} level</p>
                      </div>
                      <span className={`skeu-badge ${status.badge} flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="skeu-card h-fit p-6">
              <h3 className="skeu-emboss font-bold text-[#2a2733]">Summary</h3>
              <dl className="mt-4 space-y-3">
                {[
                  ["Skills matched", gap.summary.done, "skeu-badge-green"],
                  ["In progress", gap.summary.inProgress, "skeu-badge-amber"],
                  ["Skills missing", gap.summary.missing, "skeu-badge-red"],
                ].map(([label, value, badge]) => (
                  <div key={label} className="skeu-well flex items-center justify-between p-3">
                    <dt className="skeu-emboss text-sm font-semibold text-[#5d5768]">{label}</dt>
                    <dd className={`skeu-badge ${badge} rounded-full px-2.5 py-0.5 text-sm font-extrabold`}>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="skeu-emboss mt-5 text-sm leading-relaxed text-[#6b6476]">
                Missing skills will become the input for your personalized learning roadmap in M5.
              </p>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}

export default function SkillGapPage() {
  return <ProtectedRoute><SkillGapContent /></ProtectedRoute>;
}
