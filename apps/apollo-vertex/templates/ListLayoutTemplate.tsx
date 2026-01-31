"use client";

import { ShellLayout } from "@/registry/shell/internal/shell-layout";
import { FullscreenShellToggle } from "./components/FullscreenShellToggle";

export function ListLayoutTemplate() {
  return (
    <ShellLayout companyName="UiPath" productName="Apollo Vertex">
      <FullscreenShellToggle />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">List</h1>
        <p className="text-muted-foreground">
          This is a blank list layout. Use this area to build your list page.
        </p>
      </div>
    </ShellLayout>
  );
}
