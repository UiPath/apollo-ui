"use client";

import dynamic from "next/dynamic";

const DetailPagePreview = dynamic(
  () =>
    import("@/templates/detail-page/DetailPagePreview").then(
      (mod) => mod.DetailPagePreview,
    ),
  { ssr: false },
);

export default function DetailPagePreviewPage() {
  return (
    <div className="fixed inset-0 z-50 bg-background not-prose">
      <DetailPagePreview />
    </div>
  );
}
