import { Check } from "lucide-react";
import Logo from "@/components/ui/Logo";

const benefits = [
  "See exactly which skills your dream role needs",
  "Get a personalized week-by-week learning roadmap",
  "Track your career readiness as you grow",
];

// Split-screen layout for the login and register pages:
// a stitched leather panel on the left and a paper card with the form on the right.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Leather brand panel (hidden on small screens) */}
      <aside className="skeu-leather hidden p-14 text-white lg:flex lg:flex-col">
        <span className="skeu-screw absolute left-7 top-7" aria-hidden="true" />
        <span className="skeu-screw absolute right-7 top-7" aria-hidden="true" />
        <span className="skeu-screw absolute bottom-7 left-7" aria-hidden="true" />
        <span className="skeu-screw absolute bottom-7 right-7" aria-hidden="true" />

        <div className="relative z-10"><Logo light /></div>
        <div className="relative z-10 my-auto max-w-md">
          <h2 className="skeu-engrave text-4xl font-bold leading-tight tracking-tight">
            Turn your skill gaps into a clear career plan.
          </h2>
          <p className="skeu-engrave mt-4 text-lg text-indigo-100">
            SkillSync compares your skills with what employers expect and shows you what to learn next.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map((b) => (
              <li key={b} className="skeu-engrave flex items-center gap-3 text-indigo-50">
                <span className="skeu-check-done grid h-6 w-6 shrink-0 place-items-center rounded-full">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="skeu-engrave relative z-10 text-sm text-indigo-200">
          Built for university students, fresh graduates and beginners in tech.
        </p>
      </aside>

      {/* Paper form card */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="skeu-card mx-auto my-auto w-full max-w-md p-8 sm:p-10">
          <h1 className="skeu-emboss text-3xl font-bold tracking-tight text-[#2a2733]">{title}</h1>
          <p className="skeu-emboss mt-2 text-[#6b6476]">{subtitle}</p>
          <hr className="skeu-divider my-6" />
          {children}
        </div>
      </main>
    </div>
  );
}
