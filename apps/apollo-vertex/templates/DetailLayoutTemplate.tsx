"use client";

import { ShellLayout } from "@/registry/shell/internal/shell-layout";
import { FullscreenShellToggle } from "./components/FullscreenShellToggle";

export function DetailLayoutTemplate() {
  return (
    <ShellLayout companyName="UiPath" productName="Apollo Vertex">
      <FullscreenShellToggle />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Detail</h1>
        <p className="text-muted-foreground">
          This is a blank detail layout. Use this area to build your detail page.
        </p>
      </div>
    </ShellLayout>
  );
}
