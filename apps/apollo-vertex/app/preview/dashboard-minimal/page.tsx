"use client";

import { DashboardTemplate } from "@/templates/dashboard/DashboardTemplateDynamic";

export default function DashboardMinimalPreviewPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <DashboardTemplate shellVariant="minimal" />
    </div>
  );
}
