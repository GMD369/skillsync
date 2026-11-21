"use client";

import { useState } from "react";
import { BookOpen, CalendarDays, GraduationCap, Save, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { validateProfileForm } from "@/lib/validators";
import FormField from "@/components/ui/FormField";
import TagInput from "@/components/ui/TagInput";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

// Personal and education details (FR-04).
export default function ProfileDetailsCard() {
  const { user, token, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    university: user.university || "",
    degree: user.degree || "",
    graduationYear: user.graduationYear ? String(user.graduationYear) : "",
  });
  const [interests, setInterests] = useState(user.interests || []);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type, text }
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateProfileForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const data = await apiRequest("/profile", { method: "PUT", token, body: { ...form, interests } });
      updateUser(data.user); // navbar + dashboard update immediately
      setStatus({ type: "success", text: "Profile saved." });
    } catch (err) {
      setErrors(err.errors || {});
      setStatus({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="skeu-card p-6 sm:p-7">
      <h2 className="skeu-emboss flex items-center gap-2 text-lg font-bold text-[#2a2733]">
        <GraduationCap className="h-5 w-5 text-[#4639d6]" aria-hidden="true" /> Personal &amp; education
      </h2>
      <p className="skeu-emboss mt-1 text-sm text-[#6b6476]">Add your university and degree to complete your profile.</p>
      <hr className="skeu-divider my-5" />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {status && <Alert variant={status.type}>{status.text}</Alert>}
        <FormField label="Full name" id="name" icon={User} value={form.name} onChange={handleChange} error={errors.name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="University / college" id="university" icon={BookOpen} placeholder="e.g. FAST University"
            value={form.university} onChange={handleChange} error={errors.university} />
          <FormField label="Degree" id="degree" icon={GraduationCap} placeholder="e.g. BS Computer Science"
            value={form.degree} onChange={handleChange} error={errors.degree} />
        </div>
        <FormField label="Graduation year" id="graduationYear" type="number" icon={CalendarDays} placeholder="e.g. 2027"
          value={form.graduationYear} onChange={handleChange} error={errors.graduationYear} />
        <TagInput id="interests" label="Career interests" values={interests} onChange={(v) => { setInterests(v); setStatus(null); }}
          placeholder="e.g. Web Development" max={10} hint="What areas would you like to work in? (max 10)" />
        <div>
          <Button type="submit" loading={saving}>
            {!saving && <Save className="h-4 w-4" aria-hidden="true" />} {saving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </form>
    </section>
  );
}
