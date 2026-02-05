"use client";

import { LocaleProvider } from "@/registry/shell/internal/locale-provider";
import { ShellLayout } from "@/registry/shell/internal/shell-layout";

interface ShellTemplateProps {
  variant?: "minimal";
}

export function ShellTemplate({ variant }: ShellTemplateProps) {
  return (
    <LocaleProvider>
      <ShellLayout
        companyName="UiPath"
        productName="Apollo Vertex"
        variant={variant}
      >
        <div />
      </ShellLayout>
    </LocaleProvider>
  );
}
