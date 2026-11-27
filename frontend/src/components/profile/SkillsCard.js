"use client";

import { useState } from "react";
import { Save, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useSubmitLock } from "@/lib/useSubmitLock";
import TagInput from "@/components/ui/TagInput";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// The student's current skills (FR-05).
// Only unsaved edits are kept in local state ("draft"). Without a draft the card shows the
// saved skills from the user, so skills added from the resume card appear here automatically.
export default function SkillsCard() {
  const { user, token, updateUser } = useAuth();
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const lock = useSubmitLock();

  const saved = user.skills || [];
  const skills = draft ?? saved;
  const changed = draft !== null && (draft.length !== saved.length || draft.some((s, i) => s !== saved[i]));

  const save = () => lock(async () => {
    setSaving(true);
    try {
      const data = await apiRequest("/profile", { method: "PUT", token, body: { skills } });
      updateUser(data.user);
      setDraft(null);
      setStatus({ type: "success", text: `Skills saved (${data.user.skills.length}).` });
    } catch (err) {
      setStatus({ type: "error", text: err.errors?.skills || err.message });
    } finally {
      setSaving(false);
    }
  });

  return (
    <section className="skeu-card p-6 sm:p-7">
      <h2 className="skeu-emboss flex items-center gap-2 text-lg font-bold text-[#2a2733]">
        <Wrench className="h-5 w-5 text-[#4639d6]" aria-hidden="true" /> Your skills
      </h2>
      <p className="skeu-emboss mt-1 text-sm text-[#6b6476]">
        These skills are compared with your career goal in the Skill Gap Analysis.
      </p>
      <hr className="skeu-divider my-5" />
      <div className="flex flex-col gap-4">
        {status && <Alert variant={status.type}>{status.text}</Alert>}
        <TagInput id="skills" label={`Skills (${skills.length}/50)`} values={skills}
          onChange={(v) => { setDraft(v); setStatus(null); }} placeholder="e.g. JavaScript" max={50} />
        {skills.length === 0 && (
          <p className="skeu-emboss text-sm italic text-[#8d8577]">No skills yet. Add them here or upload your resume below.</p>
        )}
        <div className="flex items-center gap-3">
          <Button onClick={save} loading={saving} disabled={!changed}>
            {!saving && <Save className="h-4 w-4" aria-hidden="true" />} {saving ? "Saving..." : "Save skills"}
          </Button>
          {changed && <span className="skeu-emboss text-sm text-[#7a4b00]">You have unsaved changes</span>}
        </div>
      </div>
    </section>
  );
}
