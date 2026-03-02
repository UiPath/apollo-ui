"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, FileText } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ShellNavigationProvider,
  useShellNavigation,
} from "@/registry/shell/shell-navigation-context";
import { Toaster } from "@/registry/sonner/sonner";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { ShellTemplate } from "@/templates/ShellTemplate";
import { AnalyticsPage } from "./analytics-page";
import { InvoiceDashboard } from "./invoice-dashboard";
import { InvoicesListPage } from "./invoices-list-page";
import { ProjectsPage } from "./projects-page";

const assignedInvoices = [
  { id: "INV-4021", vendor: "Acme Corp" },
  { id: "INV-4018", vendor: "Globex Inc" },
  { id: "INV-4015", vendor: "Initech Ltd" },
  { id: "INV-4012", vendor: "Vandelay Industries" },
  { id: "INV-4009", vendor: "Stark Manufacturing" },
];

function InvoiceSidebarSection({
  selectedInvoice,
  onSelectInvoice,
}: {
  selectedInvoice: string | null;
  onSelectInvoice: (id: string) => void;
}) {
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const nav = useShellNavigation();

  return (
    <AnimatePresence>
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <div
            className="mt-4 pt-4"
            style={{
              borderTop:
                "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)",
            }}
          >
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              Invoices Assigned to me
            </h3>
            <div className="space-y-0.5">
              {assignedInvoices.map((inv) => {
                const isActive =
                  nav?.activePage === "analytics" && selectedInvoice === inv.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => {
                      onSelectInvoice(inv.id);
                      nav?.onNavigate("analytics");
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs">
                      {inv.vendor} — {inv.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
  const [activePage, setActivePage] = useState<
    "dashboard" | "projects" | "invoices" | "analytics"
  >("dashboard");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  return (
    <ShellNavigationProvider
      activePage={activePage}
      onNavigate={(page) =>
        setActivePage(
          page as "dashboard" | "projects" | "invoices" | "analytics",
        )
      }
    >
      <ShellTemplate
        sidebarActions={
          <>
            <VisibilityToggle
              visible={contentVisible}
              onToggle={() => setContentVisible((v) => !v)}
            />
            <InvoiceSidebarSection
              selectedInvoice={selectedInvoice}
              onSelectInvoice={setSelectedInvoice}
            />
          </>
        }
      >
        <AnimatePresence mode="wait">
          {contentVisible ||
          activePage === "analytics" ||
          activePage === "invoices" ? (
            <motion.div
              key={
                activePage === "analytics"
                  ? `analytics-${selectedInvoice}`
                  : activePage
              }
              className="h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <InvoiceDashboard visible={activePage === "dashboard"} />
              <ProjectsPage visible={activePage === "projects"} />
              <InvoicesListPage
                visible={activePage === "invoices"}
                onSelectInvoice={(id) => {
                  setSelectedInvoice(id);
                }}
              />
              <AnalyticsPage
                visible={activePage === "analytics"}
                invoiceId={selectedInvoice || "INV-4021"}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </ShellTemplate>
      <Toaster position="bottom-right" invert closeButton />
    </ShellNavigationProvider>
  );
}
