"use client";

import type { ReactNode } from "react";
import { ShellTemplate } from "@/templates/ShellTemplate";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <ShellTemplate>{children}</ShellTemplate>;
}
