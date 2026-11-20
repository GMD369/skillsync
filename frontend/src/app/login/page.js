"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { validateLoginForm } from "@/lib/validators";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go straight to the dashboard.
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined }); // clear the field's error while typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validateLoginForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setErrors(err.errors || {});
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue your learning journey.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && <Alert>{serverError}</Alert>}
        <FormField label="Email address" id="email" type="email" icon={Mail} autoComplete="email"
          placeholder="you@university.edu" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Password" id="password" type="password" icon={Lock} autoComplete="current-password"
          placeholder="Enter your password" value={form.password} onChange={handleChange} error={errors.password} />
        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          {submitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="skeu-emboss mt-8 text-center text-sm text-[#6b6476]">
        New to SkillSync?{" "}
        <Link href="/register" className="font-bold text-[#4639d6] hover:text-[#2a2192]">Create a free account</Link>
      </p>
    </AuthLayout>
  );
}
