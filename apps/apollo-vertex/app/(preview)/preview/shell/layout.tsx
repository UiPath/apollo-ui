"use client";

import type { ReactNode } from "react";
import { ShellTemplate } from "@/templates/shell/ShellContextTemplate";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <ShellTemplate>{children}</ShellTemplate>;
}
