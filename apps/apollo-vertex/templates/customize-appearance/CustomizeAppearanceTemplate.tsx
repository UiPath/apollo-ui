"use client";

import dynamic from "next/dynamic";

export const CustomizeAppearanceTemplate = dynamic(
  () =>
    import("./CustomizeAppearancePreview").then((mod) => ({
      default: mod.CustomizeAppearancePreview,
    })),
  { ssr: false },
);
