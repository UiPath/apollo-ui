"use client";

import dynamic from "next/dynamic";

const DashboardTemplate = dynamic(
  () =>
    import("@/templates/dashboard/DashboardTemplate").then(
      (mod) => mod.DashboardTemplate,
    ),
  { ssr: false },
);

export default function DashboardMinimalPreviewPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background not-prose">
      <DashboardTemplate shellVariant="minimal" />
    </div>
  );
}
