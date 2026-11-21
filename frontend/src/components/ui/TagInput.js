"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

// Lets the student add and remove short text values (skills, interests).
// Type a value and press Enter or comma, or click "Add". Duplicates are ignored (case-insensitive).
export default function TagInput({ id, label, values, onChange, placeholder, max = 50, maxLength = 40, hint }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const add = () => {
    const value = draft.trim().replace(/\s+/g, " ");
    if (!value) return;
    if (value.length > maxLength) return setError(`Each item must be at most ${maxLength} characters`);
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) return setError(`"${value}" is already added`);
    if (values.length >= max) return setError(`You can add at most ${max}`);
    onChange([...values, value]);
    setDraft("");
    setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1)); // quick remove of the last tag
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="skeu-emboss text-sm font-semibold text-[#3b3646]">{label}</label>
      <div className="flex gap-2">
        <input id={id} value={draft} onChange={(e) => { setDraft(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown} placeholder={placeholder}
          className="skeu-input h-11 w-full rounded-xl px-4 text-sm" aria-describedby={`${id}-help`} />
        <button type="button" onClick={add}
          className="skeu-btn skeu-btn-secondary flex h-11 shrink-0 items-center gap-1 rounded-xl px-4 text-sm font-semibold">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </div>
      <p id={`${id}-help`} className={`text-xs ${error ? "font-medium text-[#b2302a]" : "skeu-emboss text-[#7a7366]"}`}>
        {error || hint || "Press Enter or comma to add."}
      </p>
      {values.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2" aria-label={label}>
          {values.map((v) => (
            <li key={v} className="skeu-chip flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm font-semibold">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}
                className="grid h-5 w-5 place-items-center rounded-full text-[#6b6476] hover:bg-black/10 hover:text-[#b2302a]"
                aria-label={`Remove ${v}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
