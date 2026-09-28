"use client";

import dynamic from "next/dynamic";
import type React from "react";

type ShellTemplateProps = React.ComponentProps<
  typeof import("./ShellTemplate").ShellTemplate
>;

export const ShellTemplate = dynamic<ShellTemplateProps>(
  () =>
    import("./ShellTemplate").then((mod) => ({
      default: mod.ShellTemplate,
    })),
  { ssr: false },
);
