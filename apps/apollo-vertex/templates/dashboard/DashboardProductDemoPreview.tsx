"use client";

import dynamic from "next/dynamic";
import { productDemoDataset } from "./product-demo-data";
import type { DashboardTemplateProps } from "./DashboardTemplate";

function DashboardSkeleton() {
  return (
    <div className="flex h-full bg-background">
      {/* Sidebar skeleton */}
      <div className="w-14 h-full bg-sidebar border-r border-border shrink-0 animate-pulse" />
      {/* Content skeleton */}
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
          <div className="h-7 w-56 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          <div className="flex flex-col gap-3">
            <div className="flex-1 rounded-2xl bg-muted/50 animate-pulse" />
            <div className="h-14 rounded-2xl bg-muted/50 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-3">
            <div className="rounded-2xl bg-muted/50 animate-pulse" />
            <div className="rounded-2xl bg-muted/50 animate-pulse" />
            <div className="rounded-2xl bg-muted/50 animate-pulse" />
            <div className="rounded-2xl bg-muted/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

const DashboardTemplate = dynamic<DashboardTemplateProps>(
  () =>
    import("./DashboardTemplate").then((mod) => ({
      default: mod.DashboardTemplate,
    })),
  { ssr: false, loading: DashboardSkeleton },
);

export function DashboardProductDemoPreview() {
  return <DashboardTemplate dataset={productDemoDataset} />;
}
