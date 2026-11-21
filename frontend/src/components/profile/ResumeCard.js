"use client";

import { useRef, useState } from "react";
import { Download, FileText, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiDownload, apiRequest } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import { validateResumeFile } from "@/lib/validators";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// Resume upload (FR-06) connected to the AI Resume Analyzer (FR-07).
// Flow: choose PDF -> backend saves it -> AI service detects skills -> student picks which to add.
export default function ResumeCard() {
  const { user, token, updateUser } = useAuth();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(null); // "upload" | "add" | "delete" | null
  const [status, setStatus] = useState(null);
  const [suggestions, setSuggestions] = useState([]); // detected skills not yet in the profile
  const [selected, setSelected] = useState([]);

  const resume = user.resume;

  const upload = async (file) => {
    setStatus(null);
    const problem = validateResumeFile(file);
    if (problem) return setStatus({ type: "error", text: problem });

    const form = new FormData();
    form.append("resume", file);
    setBusy("upload");
    try {
      const data = await apiRequest("/profile/resume", { method: "POST", token, form });
      updateUser(data.user);
      setSuggestions(data.newSkills);
      setSelected(data.newSkills); // all new skills are pre-selected
      setStatus({ type: data.analysis === "completed" ? "success" : "info", text: data.message });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addSelected = async () => {
    setBusy("add");
    try {
      const data = await apiRequest("/profile", { method: "PUT", token, body: { skills: [...user.skills, ...selected] } });
      updateUser(data.user); // the Skills card and dashboard update automatically
      setStatus({ type: "success", text: `${selected.length} skill${selected.length === 1 ? "" : "s"} added to your profile.` });
      setSuggestions([]);
      setSelected([]);
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete your uploaded resume? Your saved skills will not be removed.")) return;
    setBusy("delete");
    try {
      const data = await apiRequest("/profile/resume", { method: "DELETE", token });
      updateUser(data.user);
      setSuggestions([]);
      setStatus({ type: "success", text: "Resume deleted." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const download = () =>
    apiDownload("/profile/resume", token, resume.originalName).catch((err) =>
      setStatus({ type: "error", text: err.message }));

  const toggle = (skill) =>
    setSelected(selected.includes(skill) ? selected.filter((s) => s !== skill) : [...selected, skill]);

  return (
    <section className="skeu-card p-6 sm:p-7">
      <h2 className="skeu-emboss flex items-center gap-2 text-lg font-bold text-[#2a2733]">
        <FileText className="h-5 w-5 text-[#4639d6]" aria-hidden="true" /> Resume &amp; AI skill detection
      </h2>
      <p className="skeu-emboss mt-1 text-sm text-[#6b6476]">
        Upload your resume (PDF, max 2 MB). Our AI analyzer reads it and suggests skills for your profile.
      </p>
      <hr className="skeu-divider my-5" />

      <div className="flex flex-col gap-4">
        {status && <Alert variant={status.type}>{status.text}</Alert>}

        {/* Current resume */}
        {resume && (
          <div className="skeu-well flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="skeu-tile grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="skeu-emboss truncate font-semibold text-[#2a2733]">{resume.originalName}</p>
                <p className="skeu-emboss text-xs text-[#7a7366]">
                  {formatBytes(resume.size)} &middot; uploaded {formatDate(resume.uploadedAt)} &middot;{" "}
                  {resume.detectedSkills.length} skills detected
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={download}>
                <Download className="h-4 w-4" aria-hidden="true" /> Download
              </Button>
              <Button variant="secondary" size="sm" onClick={remove} loading={busy === "delete"} className="text-[#b2302a]">
                {busy !== "delete" && <Trash2 className="h-4 w-4" aria-hidden="true" />} Delete
              </Button>
            </div>
          </div>
        )}

        {/* Drop zone */}
        <div
          data-active={dragging}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
          className="skeu-dropzone flex flex-col items-center rounded-2xl px-6 py-8 text-center"
        >
          <UploadCloud className="h-10 w-10 text-[#8d8577]" aria-hidden="true" />
          <p className="skeu-emboss mt-3 font-semibold text-[#3b3646]">
            {busy === "upload" ? "Uploading and analyzing your resume..." : "Drag and drop your PDF here"}
          </p>
          <p className="skeu-emboss mt-1 text-sm text-[#7a7366]">or</p>
          <input ref={inputRef} id="resume-file" type="file" accept="application/pdf,.pdf" className="sr-only"
            onChange={(e) => upload(e.target.files[0])} disabled={busy === "upload"} />
          <Button variant="primary" className="mt-3" loading={busy === "upload"}
            onClick={() => inputRef.current?.click()}>
            {busy !== "upload" && <UploadCloud className="h-4 w-4" aria-hidden="true" />}
            {resume ? "Upload a new resume" : "Choose PDF file"}
          </Button>
        </div>

        {/* AI suggestions */}
        {suggestions.length > 0 && (
          <div className="skeu-well p-5">
            <p className="skeu-emboss flex items-center gap-2 font-bold text-[#2a2733]">
              <Sparkles className="h-4 w-4 text-[#4639d6]" aria-hidden="true" />
              New skills found in your resume
            </p>
            <p className="skeu-emboss mt-1 text-sm text-[#6b6476]">Click a skill to select or deselect it.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" aria-pressed={selected.includes(s)} onClick={() => toggle(s)}
                  className="skeu-chip-option rounded-full px-3 py-1 text-sm font-semibold">
                  {selected.includes(s) ? "✓ " : "+ "}{s}
                </button>
              ))}
            </div>
            <Button className="mt-4" onClick={addSelected} loading={busy === "add"} disabled={!selected.length}>
              Add {selected.length} selected skill{selected.length === 1 ? "" : "s"} to my profile
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
