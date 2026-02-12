"use client";

import { ShellLayout } from "@/registry/shell/shell-layout";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

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
