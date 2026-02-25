"use client";

import { ShellTemplate } from "@/templates/ShellTemplate";
import { LoanQcDashboard } from "./loan-qc-dashboard";

export default function ShellMinimalPreviewPage() {
  return (
    <ShellTemplate variant="minimal">
      <LoanQcDashboard />
    </ShellTemplate>
  );
}
