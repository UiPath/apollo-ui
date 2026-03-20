"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Clock,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ShellNavigationProvider,
  useShellNavigation,
} from "@/registry/shell/shell-navigation-context";
import { Toaster } from "@/registry/sonner/sonner";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";
import { ShellTemplate } from "@/templates/ShellTemplate";
import { AnalyticsPage } from "./analytics-page";
import { DashboardV2Page } from "./dashboard-v2-page";
import { ImmersiveDashboardPage } from "./immersive-dashboard-page";
import { InvoiceDashboard } from "./invoice-dashboard";
import { InvoicesListPage } from "./invoices-list-page";
import { ProjectsPage } from "./projects-page";

const assignedInvoices: {
  id: string;
  vendor: string;
  statusIcon?: LucideIcon;
  statusColor?: string;
}[] = [
  {
    id: "INV-4021",
    vendor: "Acme Corp",
    statusIcon: CheckCircle,
    statusColor: "text-emerald-500",
  },
  {
    id: "INV-4018",
    vendor: "Globex Inc",
    statusIcon: Clock,
    statusColor: "text-amber-500",
  },
  {
    id: "INV-4015",
    vendor: "Initech Ltd",
    statusIcon: Circle,
    statusColor: "text-muted-foreground",
  },
  {
    id: "INV-4012",
    vendor: "Vandelay Industries",
    statusIcon: Circle,
    statusColor: "text-muted-foreground",
  },
  {
    id: "INV-4009",
    vendor: "Stark Manufacturing",
    statusIcon: Circle,
    statusColor: "text-muted-foreground",
  },
];

function InvoiceSidebarSection({
  selectedInvoice,
  onSelectInvoice,
  approvedInvoices,
}: {
  selectedInvoice: string | null;
  onSelectInvoice: (id: string) => void;
  approvedInvoices: Set<string>;
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
                    <span className="truncate text-xs text-left flex-1">
                      {inv.vendor} — {inv.id}
                    </span>
                    {(() => {
                      const isApproved = approvedInvoices.has(inv.id);
                      const StatusIcon = isApproved
                        ? CheckCircle
                        : inv.statusIcon;
                      const color = isApproved
                        ? "text-emerald-500"
                        : inv.statusColor;
                      if (!StatusIcon) return null;
                      return (
                        <StatusIcon
                          className={cn("w-3.5 h-3.5 shrink-0", color)}
                        />
                      );
                    })()}
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

export default function ShellPreviewPage() {
  const [activePage, setActivePage] = useState<
    | "dashboard"
    | "dashboard-v2"
    | "immersive-dashboard"
    | "projects"
    | "invoices"
    | "analytics"
  >("dashboard");
  const [backgroundMode, setBackgroundMode] = useState<string | undefined>();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [approvedInvoices, setApprovedInvoices] = useState<Set<string>>(
    new Set(),
  );

  return (
    <ShellNavigationProvider
      activePage={activePage}
      onNavigate={(page) => {
        if (page === "immersive-dashboard") {
          setBackgroundMode("expressive");
        } else {
          setBackgroundMode(undefined);
        }
        setActivePage(
          page as
            | "dashboard"
            | "dashboard-v2"
            | "immersive-dashboard"
            | "projects"
            | "invoices"
            | "analytics",
        );
      }}
    >
      <ShellTemplate
        backgroundMode={backgroundMode}
        sidebarActions={
          <InvoiceSidebarSection
            selectedInvoice={selectedInvoice}
            onSelectInvoice={setSelectedInvoice}
            approvedInvoices={approvedInvoices}
          />
        }
      >
        <AnimatePresence mode="wait">
          {activePage ? (
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
              <DashboardV2Page visible={activePage === "dashboard-v2"} />
              <ImmersiveDashboardPage
                visible={activePage === "immersive-dashboard"}
                onBackgroundModeChange={setBackgroundMode}
              />
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
                onApprove={(id) =>
                  setApprovedInvoices((prev) => new Set(prev).add(id))
                }
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </ShellTemplate>
      <Toaster position="bottom-right" invert closeButton />
    </ShellNavigationProvider>
  );
}
