import Link from "next/link";

// Main navigation shown on every page.
const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/skill-gap", label: "Skill Gap" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="text-xl font-bold">SkillSync</Link>
      <div className="flex gap-6 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>
        ))}
        <Link href="/login" className="font-semibold">Login</Link>
      </div>
    </nav>
  );
}
