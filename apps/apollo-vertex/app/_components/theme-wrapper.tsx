"use client";

import type React from "react";
import { ThemeProvider } from "@uipath/apollo-vertex/shell";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider storageKey="theme">{children}</ThemeProvider>;
}
