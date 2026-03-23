"use client";

import { DashboardTemplate } from "@/templates/dashboard/DashboardTemplateDynamic";

export default function DashboardPreviewPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <DashboardTemplate />
    </div>
  );
}
