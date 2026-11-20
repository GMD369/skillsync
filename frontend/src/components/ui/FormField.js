"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

// Labelled recessed input with optional icon, show/hide for passwords, hint and error message.
export default function FormField({ label, id, error, icon: Icon, type = "text", hint, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="skeu-emboss text-sm font-semibold text-[#3b3646]">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8d8577]"
            aria-hidden="true" />
        )}
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          className={`skeu-input h-12 w-full rounded-xl text-sm ${Icon ? "pl-10" : "pl-4"} ${isPassword ? "pr-12" : "pr-4"}
            ${error ? "skeu-input-error" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button type="button" onClick={() => setVisible(!visible)}
            className="skeu-btn skeu-btn-secondary absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg"
            aria-label={visible ? "Hide password" : "Show password"}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-[#b2302a]">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="skeu-emboss text-xs text-[#7a7366]">{hint}</p>
      ) : null}
    </div>
  );
}
