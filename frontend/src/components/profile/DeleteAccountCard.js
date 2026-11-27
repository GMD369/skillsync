"use client";

import { useState } from "react";
import { Lock, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useSubmitLock } from "@/lib/useSubmitLock";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";

// Deletes the account and all stored data (user, resume file, roadmap). The password is asked again.
export default function DeleteAccountCard() {
  const { token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useSubmitLock();

  const submit = async (event) => {
    event.preventDefault();
    if (!password) return setError("Enter your password to confirm");
    await lock(async () => {
      setBusy(true);
      setError("");
      try {
        await apiRequest("/profile", { method: "DELETE", token, body: { password } });
        logout(); // the protected page then sends the visitor to the login page
      } catch (err) {
        setError(err.errors?.password || err.message);
        setBusy(false);
      }
    });
  };

  return (
    <section className="skeu-card p-6">
      <h2 className="skeu-emboss text-lg font-bold text-[#2a2733]">Delete account</h2>
      <p className="skeu-emboss mt-1 text-sm text-[#6b6476]">
        Permanently removes your profile, skills, resume file and learning roadmap. This cannot be undone.
      </p>
      {!open ? (
        <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete my account
        </Button>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4 sm:max-w-sm" noValidate>
          <FormField label="Confirm with your password" id="delete-password" type="password" icon={Lock}
            autoComplete="current-password" value={password} error={error}
            onChange={(e) => { setPassword(e.target.value); setError(""); }} />
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>{busy ? "Deleting..." : "Delete permanently"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setPassword(""); setError(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </section>
  );
}
