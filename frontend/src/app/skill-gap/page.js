"use client";

import { Target } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ComingSoon from "@/components/layout/ComingSoon";

// Skill Gap Analysis page - built in module M4.
export default function SkillGapPage() {
  return (
    <ProtectedRoute>
      <ComingSoon
        icon={Target}
        module="M4"
        title="Skill Gap Analysis"
        description="Choose a career goal and see which required skills you already have, which are in progress and which are missing."
      />
    </ProtectedRoute>
  );
}
