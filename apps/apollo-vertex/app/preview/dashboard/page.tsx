"use client";

import dynamic from "next/dynamic";
import { invoiceProcessingDataset } from "@/templates/dashboard/dashboard-data";

const DashboardTemplate = dynamic(
  () =>
    import("@/templates/dashboard/DashboardTemplate").then(
      (mod) => mod.DashboardTemplate,
    ),
  { ssr: false },
);

export default function DashboardPreviewPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background not-prose">
      <DashboardTemplate dataset={invoiceProcessingDataset} demoMode />
    </div>
  );
}
