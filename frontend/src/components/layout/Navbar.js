"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Map, Menu, Target, UserRound, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { initials } from "@/lib/format";

const privateLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/skill-gap", label: "Skill Gap", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
];

// Login and register pages have their own full-screen layout.
const HIDDEN_ON = ["/login", "/register"];

// Brushed-metal toolbar with pressed-in tabs for the active page.
export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (HIDDEN_ON.includes(pathname)) return null;

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/login");
  };

  const linkClass = (href) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      pathname === href ? "skeu-tab-active" : "skeu-emboss text-[#4a4555] hover:text-[#2a2733]"
    }`;

  return (
    <header className="skeu-metal sticky top-0 z-40">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href={user ? "/dashboard" : "/"} />

        {!loading && user && (
          <div className="hidden items-center gap-1 rounded-xl p-1 md:flex">
            {privateLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {!loading && (
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-3 md:flex">
                  <span className="skeu-appicon grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
                    title={user.email}>
                    <span className="skeu-engrave relative z-10">{initials(user.name)}</span>
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                  </Button>
                </div>
                <Button variant="secondary" size="sm" className="w-10 px-0 md:hidden"
                  onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm">Log in</Button>
                <Button href="/register" size="sm">Get started</Button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Mobile menu */}
      {open && user && (
        <div className="border-t border-[#b9b4aa] px-4 py-3 md:hidden">
          {privateLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </Link>
          ))}
          <button onClick={handleLogout}
            className="skeu-emboss mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#b2302a]">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
