import { ArrowLeft, Construction } from "lucide-react";
import Button from "@/components/ui/Button";

// Placeholder for pages whose module has not been built yet.
export default function ComingSoon({ icon: Icon = Construction, title, description, module }) {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-5 py-16">
      <div className="skeu-card w-full max-w-xl p-10 text-center">
        <span className="skeu-tile mx-auto grid h-16 w-16 place-items-center rounded-2xl">
          <Icon className="h-8 w-8" aria-hidden="true" />
        </span>
        <span className="skeu-badge skeu-badge-amber mt-6 inline-block rounded-full px-3 py-1 text-xs font-bold">
          Coming soon &middot; {module}
        </span>
        <h1 className="skeu-emboss mt-4 text-3xl font-extrabold tracking-tight text-[#2a2733]">{title}</h1>
        <p className="skeu-emboss mt-3 text-[#5d5768]">{description}</p>
        <Button href="/dashboard" variant="secondary" className="mt-8">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
        </Button>
      </div>
    </main>
  );
}
