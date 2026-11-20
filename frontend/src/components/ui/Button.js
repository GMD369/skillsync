import Link from "next/link";
import { Loader2 } from "lucide-react";

// Reusable skeuomorphic button (glossy, presses down when clicked).
// Renders a <Link> when `href` is given.
const variants = {
  primary: "skeu-btn-primary",
  secondary: "skeu-btn-secondary",
  ghost: "skeu-btn-ghost",
  light: "skeu-btn-light",
};
const sizes = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export default function Button({
  children, href, variant = "primary", size = "md", loading = false, className = "", ...props
}) {
  const classes = `skeu-btn ${variants[variant]} ${sizes[size]} inline-flex items-center justify-center gap-2
    font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
    focus-visible:ring-offset-[#e8e2d6] disabled:cursor-not-allowed disabled:opacity-60 ${className}`;

  if (href) {
    return <Link href={href} className={classes} {...props}>{children}</Link>;
  }
  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
