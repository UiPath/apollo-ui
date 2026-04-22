"use client";

import dynamic from "next/dynamic";
import type React from "react";

type DashboardTemplateProps = React.ComponentProps<
  typeof import("./DashboardTemplate").DashboardTemplate
>;

function DashboardLoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-14 rounded-2xl bg-gradient-to-br from-insight-500 to-primary-400 flex items-center justify-center shadow-lg">
          <img
            src="/UiPath.svg"
            alt="UiPath"
            className="size-7 brightness-0 invert"
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading dashboard…
        </p>
      </div>
    </div>
  );
}

export const DashboardTemplate = dynamic<DashboardTemplateProps>(
  () =>
    import("./DashboardTemplate").then((mod) => ({
      default: mod.DashboardTemplate,
    })),
  { ssr: false, loading: DashboardLoadingFallback },
);
