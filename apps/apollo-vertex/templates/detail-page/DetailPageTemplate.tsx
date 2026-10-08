"use client";

import dynamic from "next/dynamic";

const DetailPagePreview = dynamic(
  () => import("./DetailPagePreview").then((mod) => mod.DetailPagePreview),
  { ssr: false },
);

/** The Detail page preview for docs pages: default layout, no controls. */
export function DetailPageTemplate() {
  return <DetailPagePreview embedded />;
}
