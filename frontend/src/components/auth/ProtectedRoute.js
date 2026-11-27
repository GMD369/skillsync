"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, WifiOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

// Wrap a page with this to allow only logged-in students (FR-03).
export default function ProtectedRoute({ children }) {
  const { user, loading, connectionError, retrySession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !connectionError) router.replace("/login");
  }, [loading, user, connectionError, router]);

  // The saved login could not be checked because the server is unreachable: keep the student
  // logged in and let them try again, instead of sending them to the login page.
  if (!loading && !user && connectionError) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
        <section className="skeu-card p-8 text-center" role="alert">
          <div className="skeu-appicon mx-auto grid h-14 w-14 place-items-center text-white">
            <WifiOff className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="skeu-emboss mt-4 text-xl font-bold text-[#2a2733]">Can&apos;t connect to SkillSync</h1>
          <p className="skeu-emboss mt-2 text-sm text-[#6b6476]">{connectionError}</p>
          <Button className="mt-5" onClick={retrySession}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </Button>
        </section>
      </main>
    );
  }

  if (loading || !user) {
    return <p className="skeu-emboss p-8 text-center text-[#6b6476]" role="status">Loading...</p>;
  }
  return children;
}
