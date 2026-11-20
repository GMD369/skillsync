"use client";

import { UserRound } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ComingSoon from "@/components/layout/ComingSoon";

// Your Profile page - built in module M2.
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ComingSoon
        icon={UserRound}
        module="M2"
        title="Your Profile"
        description="Add your education, interests and skills, and upload your resume so SkillSync can detect your skills automatically."
      />
    </ProtectedRoute>
  );
}
