import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="skeu-metal border-t border-[#b9b4aa]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-7 sm:flex-row">
        <Logo />
        <p className="skeu-emboss text-sm text-[#5d5768]">
          AI-powered skill development and career guidance for students.
        </p>
      </div>
    </footer>
  );
}
