import { AlertTriangle } from "lucide-react";

// Error banner shown at the top of a form.
export default function Alert({ children }) {
  return (
    <div role="alert" className="skeu-alert flex items-start gap-3 rounded-xl p-3.5 text-sm font-medium">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
