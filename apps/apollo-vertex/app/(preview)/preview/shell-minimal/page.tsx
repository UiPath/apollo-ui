"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ShellTemplate } from "@/templates/ShellTemplate";
import { LoanQcDashboard } from "./loan-qc-dashboard";

function VisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const Icon = visible ? Eye : EyeOff;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function ShellMinimalPreviewPage() {
  const [contentVisible, setContentVisible] = useState(true);

  return (
    <ShellTemplate
      variant="minimal"
      headerActions={
        <VisibilityToggle
          visible={contentVisible}
          onToggle={() => setContentVisible((v) => !v)}
        />
      }
    >
      <LoanQcDashboard visible={contentVisible} />
    </ShellTemplate>
  );
}
