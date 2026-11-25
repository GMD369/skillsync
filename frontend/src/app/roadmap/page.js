"use client";

import { useEffect, useState } from "react";
import { Check, Map, RefreshCw, Sparkles, Target, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

// Learning Roadmap page (M5). Every action is one database operation on the "roadmaps" collection:
// Create (POST), Read (GET), Update a task (PATCH) and Delete (DELETE).
function RoadmapContent() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null); // { roadmap, outdated }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // "create" | "delete" | taskId | null
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest("/career/roadmap", { token })
      .then((res) => active && setData(res))
      .catch((err) => active && err.status !== 404 && setStatus({ type: "error", text: err.message }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  const run = async (key, action) => {
    setBusy(key);
    setStatus(null);
    try {
      await action();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const create = () => run("create", async () => {
    const res = await apiRequest("/career/roadmap", { method: "POST", token });
    setData(res);
    setStatus({ type: "success", text: res.message });
  });

  const toggle = (task) => run(task._id, async () => {
    const res = await apiRequest(`/career/roadmap/tasks/${task._id}`, { method: "PATCH", token, body: { done: !task.done } });
    setData(res);
  });

  const remove = () => {
    if (!window.confirm("Delete your roadmap and its progress?")) return;
    run("delete", async () => {
      const res = await apiRequest("/career/roadmap", { method: "DELETE", token });
      setData(null);
      setStatus({ type: "success", text: res.message });
    });
  };

  if (loading) return <p className="skeu-emboss p-8 text-center text-[#6b6476]">Loading your roadmap...</p>;

  const roadmap = data?.roadmap;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="skeu-badge skeu-badge-indigo inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
            <Map className="h-3.5 w-3.5" aria-hidden="true" /> M5 &middot; Learning Roadmap
          </span>
          <h1 className="skeu-emboss mt-4 text-3xl font-extrabold tracking-tight text-[#2a2733]">Your learning roadmap</h1>
          <p className="skeu-emboss mt-2 max-w-2xl text-[#5d5768]">
            One week for every skill you are missing for your career goal. Tick tasks as you finish them.
          </p>
        </div>
        {roadmap && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={create} loading={busy === "create"}>
              {busy !== "create" && <RefreshCw className="h-4 w-4" aria-hidden="true" />} Regenerate
            </Button>
            <Button variant="secondary" size="sm" onClick={remove} loading={busy === "delete"}>
              {busy !== "delete" && <Trash2 className="h-4 w-4" aria-hidden="true" />} Delete
            </Button>
          </div>
        )}
      </header>

      {status && <div className="mt-6"><Alert variant={status.type}>{status.text}</Alert></div>}

      {!roadmap ? (
        <section className="skeu-card mt-8 p-8 text-center">
          <div className="skeu-appicon mx-auto grid h-14 w-14 place-items-center text-white">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="skeu-emboss mt-4 text-xl font-bold text-[#2a2733]">No roadmap yet</h2>
          {user.targetRole ? (
            <>
              <p className="skeu-emboss mx-auto mt-2 max-w-md text-sm text-[#6b6476]">
                SkillSync will create a plan from the missing skills in your skill-gap report.
              </p>
              <Button className="mt-5" onClick={create} loading={busy === "create"}>Create my roadmap</Button>
            </>
          ) : (
            <>
              <p className="skeu-emboss mx-auto mt-2 max-w-md text-sm text-[#6b6476]">Choose a career goal first.</p>
              <Button className="mt-5" href="/skill-gap"><Target className="h-4 w-4" aria-hidden="true" /> Choose a career role</Button>
            </>
          )}
        </section>
      ) : (
        <>
          {data.outdated && (
            <div className="mt-6">
              <Alert variant="info">You changed your career goal after creating this roadmap. Click Regenerate to update it.</Alert>
            </div>
          )}

          <div className="skeu-gloss mt-6 rounded-2xl p-7 text-white">
            <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="skeu-engrave text-sm font-semibold text-indigo-100">Roadmap for</p>
                <h2 className="skeu-engrave mt-1 text-2xl font-extrabold">{roadmap.role.title}</h2>
                <p className="skeu-engrave mt-1 text-sm text-indigo-100">
                  {roadmap.progress.doneTasks} of {roadmap.progress.totalTasks} tasks done &middot; {roadmap.weeks.length} weeks
                </p>
              </div>
              <p className="skeu-engrave text-4xl font-extrabold">{roadmap.progress.percentage}%</p>
            </div>
            <div className="skeu-track relative z-10 mt-5 h-3.5" role="progressbar" aria-label="Roadmap progress"
              aria-valuenow={roadmap.progress.percentage} aria-valuemin={0} aria-valuemax={100}>
              <div className="skeu-fill h-3.5 transition-all" style={{ width: `${roadmap.progress.percentage}%` }} />
            </div>
          </div>

          <ol className="mt-6 grid gap-5 md:grid-cols-2">
            {roadmap.weeks.map((week) => {
              const finished = week.tasks.every((t) => t.done);
              return (
                <li key={week.week} className="skeu-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="skeu-emboss text-xs font-bold uppercase tracking-wide text-[#8d8577]">Week {week.week}</p>
                      <h3 className="skeu-emboss mt-1 text-lg font-bold text-[#2a2733]">{week.skill}</h3>
                      <p className="skeu-emboss text-xs capitalize text-[#8d8577]">{week.level} level</p>
                    </div>
                    <span className={`skeu-badge ${finished ? "skeu-badge-green" : "skeu-badge-amber"} rounded-full px-2.5 py-0.5 text-xs font-bold`}>
                      {week.tasks.filter((t) => t.done).length}/{week.tasks.length}
                    </span>
                  </div>
                  <ul className="skeu-well mt-4 divide-y divide-black/5 px-3">
                    {week.tasks.map((task) => (
                      <li key={task._id}>
                        <button type="button" onClick={() => toggle(task)} disabled={busy === task._id}
                          role="checkbox" aria-checked={task.done}
                          className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-60">
                          <span className={`${task.done ? "skeu-check-done" : "skeu-check"} grid h-6 w-6 shrink-0 place-items-center`}>
                            {task.done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                          </span>
                          <span className={`skeu-emboss text-sm ${task.done ? "text-[#8d8577] line-through" : "font-medium text-[#3b3646]"}`}>
                            {task.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
          <p className="skeu-emboss mt-6 text-xs text-[#8d8577]">
            Tasks are created from templates for now. AI-personalized tasks with learning resources are coming next.
          </p>
        </>
      )}
    </main>
  );
}

export default function RoadmapPage() {
  return <ProtectedRoute><RoadmapContent /></ProtectedRoute>;
}
