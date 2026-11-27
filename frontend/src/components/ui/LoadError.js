import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

// Shown when data for a page could not be loaded. The student can retry without reloading the page.
export default function LoadError({ message, onRetry, retrying = false }) {
  return (
    <div role="alert" className="skeu-alert flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5 text-sm font-medium">
      <span className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </span>
      <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying}>
        {!retrying && <RefreshCw className="h-4 w-4" aria-hidden="true" />} Try again
      </Button>
    </div>
  );
}
