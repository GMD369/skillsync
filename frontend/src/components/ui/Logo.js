import Link from "next/link";

// SkillSync logo: glossy app-icon mark + wordmark.
export default function Logo({ light = false, href = "/" }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="SkillSync home">
      <span className="skeu-appicon grid h-9 w-9 place-items-center rounded-[10px]">
        <svg viewBox="0 0 24 24" className="relative z-10 h-5 w-5 drop-shadow-[0_-1px_0_rgba(0,0,0,0.35)]" fill="none"
          stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 17l5-5 4 4 7-8" />
          <path d="M15 8h5v5" />
        </svg>
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? "skeu-engrave text-white" : "skeu-emboss text-[#2a2733]"}`}>
        SkillSync
      </span>
    </Link>
  );
}
