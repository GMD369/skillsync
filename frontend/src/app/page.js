import { ArrowRight, BarChart3, BriefcaseBusiness, FileSearch, Map, MessagesSquare, Sparkles, Target } from "lucide-react";
import Button from "@/components/ui/Button";
import Footer from "@/components/layout/Footer";

const features = [
  { icon: FileSearch, title: "AI Resume Analyzer", text: "Upload your resume and SkillSync detects the skills you already have." },
  { icon: Target, title: "Skill Gap Analysis", text: "Compare your skills with what your target role really requires." },
  { icon: Map, title: "Personalized Roadmap", text: "Get a week-by-week plan with free resources for every missing skill." },
  { icon: BarChart3, title: "Progress Dashboard", text: "Watch your career readiness score grow as you complete tasks." },
  { icon: BriefcaseBusiness, title: "Projects & Internships", text: "Build portfolio projects and find internships that match your level." },
  { icon: MessagesSquare, title: "Interview Practice", text: "Answer role-based questions and get instant AI feedback." },
];

const steps = [
  { n: "1", title: "Create your profile", text: "Add your skills or upload your resume." },
  { n: "2", title: "Pick a career goal", text: "Frontend, Backend, Full-Stack, Data or AI/ML." },
  { n: "3", title: "See your skill gap", text: "Know exactly what is missing." },
  { n: "4", title: "Follow your roadmap", text: "Learn, build projects and track progress." },
];

// Static example of the skill-gap report shown in the hero.
const preview = [
  { skill: "React", status: "Done", cls: "skeu-badge-green" },
  { skill: "Node.js", status: "In progress", cls: "skeu-badge-amber" },
  { skill: "MongoDB", status: "Missing", cls: "skeu-badge-red" },
  { skill: "Testing", status: "Missing", cls: "skeu-badge-red" },
];

export default function Home() {
  return (
    <>
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="skeu-badge skeu-badge-indigo inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI-powered career guidance
            </span>
            <h1 className="skeu-emboss mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#2a2733] sm:text-5xl">
              Know what to learn next for your <span className="text-[#4639d6]">dream career</span>
            </h1>
            <p className="skeu-emboss mt-5 max-w-xl text-lg text-[#5d5768]">
              SkillSync compares your skills with real job requirements, shows your skill gaps and builds a
              personalized roadmap to make you job-ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/register" size="lg">Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
              <Button href="/login" variant="secondary" size="lg">Log in</Button>
            </div>
          </div>

          {/* Paper report on a clipboard */}
          <div className="relative mx-auto w-full max-w-md pt-6">
            <div className="absolute left-1/2 top-0 z-10 h-10 w-32 -translate-x-1/2 rounded-b-xl rounded-t-md"
              style={{
                background: "linear-gradient(180deg,#f2f1ee,#bdbab3 60%,#9b978f)",
                boxShadow: "inset 0 1px 0 #fff, 0 3px 6px rgba(0,0,0,.35)",
              }} aria-hidden="true" />
            <div className="skeu-card skeu-lined rotate-1 p-7 pt-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="skeu-emboss text-[11px] font-bold uppercase tracking-widest text-[#8d8577]">Target role</p>
                  <p className="skeu-emboss font-bold text-[#2a2733]">Full-Stack Developer</p>
                </div>
                <div className="text-right">
                  <p className="skeu-emboss text-[11px] font-bold uppercase tracking-widest text-[#8d8577]">Readiness</p>
                  <p className="skeu-emboss text-3xl font-extrabold text-[#4639d6]">62%</p>
                </div>
              </div>
              <div className="skeu-track mt-4 h-3.5">
                <div className="skeu-fill h-3.5 w-[62%]" />
              </div>
              <ul className="mt-5">
                {preview.map((p) => (
                  <li key={p.skill} className="flex h-10 items-center justify-between">
                    <span className="skeu-emboss text-sm font-semibold text-[#3b3646]">{p.skill}</span>
                    <span className={`skeu-badge ${p.cls} rounded-full px-2.5 py-0.5 text-xs font-bold`}>{p.status}</span>
                  </li>
                ))}
              </ul>
              <p className="skeu-emboss mt-2 text-xs italic text-[#8d8577]">Example skill gap report</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="skeu-emboss text-3xl font-extrabold tracking-tight text-[#2a2733]">
                Everything you need to become job-ready
              </h2>
              <p className="skeu-emboss mt-3 text-[#5d5768]">One platform for skill assessment, learning plans and career preparation.</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="skeu-card p-6 transition hover:-translate-y-0.5">
                  <span className="skeu-tile grid h-12 w-12 place-items-center rounded-xl">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="skeu-emboss mt-4 font-bold text-[#2a2733]">{title}</h3>
                  <p className="skeu-emboss mt-1.5 text-sm leading-relaxed text-[#5d5768]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="skeu-emboss text-center text-3xl font-extrabold tracking-tight text-[#2a2733]">How it works</h2>
            <ol className="skeu-well mt-12 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n} className="skeu-card p-6">
                  <span className="skeu-appicon grid h-10 w-10 place-items-center rounded-full text-sm font-extrabold text-white">
                    <span className="skeu-engrave relative z-10">{s.n}</span>
                  </span>
                  <h3 className="skeu-emboss mt-4 font-bold text-[#2a2733]">{s.title}</h3>
                  <p className="skeu-emboss mt-1 text-sm text-[#5d5768]">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Call to action: stitched leather plate */}
        <section className="px-6 pb-20 pt-6">
          <div className="skeu-leather mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-16 text-center text-white">
            <h2 className="skeu-engrave relative z-10 text-3xl font-extrabold tracking-tight">Start building your career roadmap today</h2>
            <p className="skeu-engrave relative z-10 mx-auto mt-3 max-w-xl text-indigo-100">
              Free for students. Create your account in less than a minute.
            </p>
            <Button href="/register" variant="light" size="lg" className="relative z-10 mt-8">
              Create free account <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
