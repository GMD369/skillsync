"use client";

import { Map } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ComingSoon from "@/components/layout/ComingSoon";

// Learning Roadmap page - built in module M5.
export default function RoadmapPage() {
  return (
    <ProtectedRoute>
      <ComingSoon
        icon={Map}
        module="M5"
        title="Learning Roadmap"
        description="Get a personalized week-by-week learning plan with free resources for every missing skill."
      />
    </ProtectedRoute>
  );
}
