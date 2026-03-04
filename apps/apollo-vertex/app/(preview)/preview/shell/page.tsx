"use client";

import { ShellTemplate } from "@/templates/ShellTemplate";
import { InvoiceDashboard } from "./invoice-dashboard";

export default function ShellPreviewPage() {
  return (
    <ShellTemplate>
      <InvoiceDashboard />
    </ShellTemplate>
  );
}
