"use client";

import type { ReactNode } from "react";
import { ShellTemplate } from "@/templates/ShellTemplate";

export default function ShellMinimalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ShellTemplate variant="minimal">{children}</ShellTemplate>;
}
