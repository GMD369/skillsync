import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

// Message banner. variant: "error" (default) | "success" | "info"
const styles = {
  error: { cls: "skeu-alert", Icon: AlertTriangle, role: "alert" },
  success: { cls: "skeu-success", Icon: CheckCircle2, role: "status" },
  info: { cls: "skeu-well text-[#4a4555]", Icon: Info, role: "status" },
};

export default function Alert({ children, variant = "error" }) {
  const { cls, Icon, role } = styles[variant];
  return (
    <div role={role} className={`${cls} flex items-start gap-3 rounded-xl p-3.5 text-sm font-medium`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
