"use client";

import { DashboardTemplate } from "@/templates/dashboard/DashboardTemplateDynamic";
import { invoiceProcessingDataset } from "@/templates/dashboard/dashboard-data";

export default function ProductDemoPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background not-prose">
      <DashboardTemplate dataset={invoiceProcessingDataset} demoMode />
    </div>
  );
}
