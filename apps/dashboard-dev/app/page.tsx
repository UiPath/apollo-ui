"use client";

import dynamic from "next/dynamic";

// Load without SSR — matches how apollo-vertex previews the dashboard
const DashboardContent = dynamic(
  () =>
    import("@/templates/dashboard/DashboardContent").then((m) => ({
      default: m.DashboardContent,
    })),
  { ssr: false },
);

export default function Page() {
  return (
    <div className="fixed inset-0 bg-background">
      <DashboardContent />
    </div>
  );
}
