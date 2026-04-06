"use client";

import type React from "react";
import { ThemeProvider } from "@/registry/shell/shell-theme-provider";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider storageKey="theme">{children}</ThemeProvider>;
}
