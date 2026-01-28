"use client";

import { LocaleProvider } from "@/registry/shell/internal/locale-provider";
import { ShellLayout } from "@/registry/shell/internal/shell-layout";

export function ShellTemplate() {
  return (
    <LocaleProvider>
      <ShellLayout companyName="UiPath" productName="Apollo Vertex">
        <div />
      </ShellLayout>
    </LocaleProvider>
  );
}
