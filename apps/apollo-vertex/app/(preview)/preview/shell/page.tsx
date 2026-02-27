"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { ShellNavigationProvider } from "@/registry/shell/shell-navigation-context";
import { ShellTemplate } from "@/templates/ShellTemplate";
import { AnalyticsPage } from "./analytics-page";
import { InvoiceDashboard } from "./invoice-dashboard";
import { ProjectsPage } from "./projects-page";

function VisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const Icon = visible ? Eye : EyeOff;

  const content = (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center rounded-md transition-colors duration-200 h-8 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full"
    >
      <span className="w-8 h-8 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            key="toggle-text"
            className="truncate whitespace-nowrap pl-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            Toggle Content
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Toggle Content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export default function ShellPreviewPage() {
  const [contentVisible, setContentVisible] = useState(true);
  const [activePage, setActivePage] = useState<"dashboard" | "projects" | "analytics">("dashboard");

  return (
    <ShellNavigationProvider activePage={activePage} onNavigate={(page) => setActivePage(page as "dashboard" | "projects" | "analytics")}>
      <ShellTemplate
        sidebarActions={
          <VisibilityToggle
            visible={contentVisible}
            onToggle={() => setContentVisible((v) => !v)}
          />
        }
      >
        <AnimatePresence mode="wait">
          {contentVisible || activePage === "analytics" ? (
            <motion.div
              key={activePage}
              className="h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <InvoiceDashboard visible={activePage === "dashboard"} />
              <ProjectsPage visible={activePage === "projects"} />
              <AnalyticsPage visible={activePage === "analytics"} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </ShellTemplate>
    </ShellNavigationProvider>
  );
}
