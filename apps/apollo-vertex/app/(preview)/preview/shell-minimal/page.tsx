"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ShellNavigationProvider } from "@/registry/shell/shell-navigation-context";
import { ShellTemplate } from "@/templates/ShellTemplate";
import { AnalyticsPage } from "./analytics-page";
import { LoanQcDashboard } from "./loan-qc-dashboard";
import { ProjectsPage } from "./projects-page";

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
  const [activePage, setActivePage] = useState<"dashboard" | "projects" | "invoices" | "analytics">("dashboard");

  return (
    <ShellNavigationProvider activePage={activePage} onNavigate={(page) => setActivePage(page as "dashboard" | "projects" | "invoices" | "analytics")}>
      <ShellTemplate
        variant="minimal"
        headerActions={
          <VisibilityToggle
            visible={contentVisible}
            onToggle={() => setContentVisible((v) => !v)}
          />
        }
      >
        <LoanQcDashboard visible={contentVisible && activePage === "dashboard"} />
        <ProjectsPage visible={contentVisible && activePage === "projects"} />
        <AnalyticsPage visible={activePage === "invoices" || activePage === "analytics"} />
      </ShellTemplate>
    </ShellNavigationProvider>
  );
}
