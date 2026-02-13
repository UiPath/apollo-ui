"use client";

import { usePathname } from "next/navigation";
import { ShellLayout } from "@/registry/shell/shell-layout";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

interface ShellTemplateProps {
  variant?: "minimal";
}

export function ShellTemplate({ variant }: ShellTemplateProps) {
  const pathname = usePathname();
  return (
    <LocaleProvider>
      <ShellLayout
        companyName="UiPath"
        productName="Apollo Vertex"
        variant={variant}
        pathname={pathname}
      >
        <div />
      </ShellLayout>
    </LocaleProvider>
  );
}
