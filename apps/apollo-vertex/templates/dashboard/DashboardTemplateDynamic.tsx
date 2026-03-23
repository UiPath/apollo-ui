"use client";

import dynamic from "next/dynamic";
import type React from "react";

type DashboardTemplateProps = React.ComponentProps<
  typeof import("./DashboardTemplate").DashboardTemplate
>;

export const DashboardTemplate = dynamic<DashboardTemplateProps>(
  () =>
    import("./DashboardTemplate").then((mod) => ({
      default: mod.DashboardTemplate,
    })),
  { ssr: false },
);
