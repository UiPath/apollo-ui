"use client";

import dynamic from "next/dynamic";

export const SidebarExampleTemplate = dynamic(
  () =>
    import("./SidebarTemplate").then((mod) => ({
      default: mod.SidebarExample,
    })),
  { ssr: false },
);
