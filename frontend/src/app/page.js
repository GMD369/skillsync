import Link from "next/link";

// Landing page
export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold">SkillSync</h1>
      <p className="mt-4 text-lg text-gray-600">
        Find your skill gaps, follow a personalized roadmap and become job-ready.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/register" className="rounded-md bg-black px-5 py-2 text-white">Get Started</Link>
        <Link href="/login" className="rounded-md border px-5 py-2">Login</Link>
      </div>
    </main>
  );
}
