"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { validateRegisterForm } from "@/lib/validators";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useSubmitLock();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validateRegisterForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    await lock(async () => {
      setSubmitting(true);
      try {
        await register(form.name, form.email, form.password);
        router.push("/dashboard");
      } catch (err) {
        setErrors(err.errors || {});
        setServerError(err.message);
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start finding your skill gaps in less than a minute.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && <Alert>{serverError}</Alert>}
        <FormField label="Full name" id="name" icon={User} autoComplete="name" placeholder="e.g. Ali Khan"
          value={form.name} onChange={handleChange} error={errors.name} />
        <FormField label="Email address" id="email" type="email" icon={Mail} autoComplete="email"
          placeholder="you@university.edu" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Password" id="password" type="password" icon={Lock} autoComplete="new-password"
          placeholder="Create a password" hint="At least 8 characters, including a letter and a number."
          value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Confirm password" id="confirmPassword" type="password" icon={Lock}
          autoComplete="new-password" placeholder="Repeat your password"
          value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="skeu-emboss mt-8 text-center text-sm text-[#6b6476]">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#4639d6] hover:text-[#2a2192]">Log in</Link>
      </p>
    </AuthLayout>
  );
}
