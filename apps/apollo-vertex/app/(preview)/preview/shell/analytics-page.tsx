"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  CheckCircle,
  CircleAlert,
  Clock,
  Grid2x2,
  Loader2,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useShellNavigation } from "@/registry/shell/shell-navigation-context";

/* ─── types ─── */

interface ActionHandler {
  chatLoading: string;
  chatDone: string;
  timelineEntry: string;
}

interface FindingAction {
  label: string;
  handler?: ActionHandler;
}

interface Finding {
  icon: LucideIcon;
  label: string;
  time: string;
  severity: "medium" | "low";
  description: string;
  detail: {
    headline: string;
    summary: string;
    actions: FindingAction[];
  };
}

interface LineItem {
  line: number;
  description: string;
  partNo: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface InvoiceConfig {
  id: string;
  vendor: string;
  amount: number;
  received: string;
  statusLabel: string;
  statusIcon: LucideIcon;
  statusColor: string;
  assignee: string;
  matchScore: string;
  purchaseOrder: string;
  paymentTerms: string;
  dueDate: string;
  description: string;
  findings: Finding[];
  timeline: { text: string; time: string }[];
  lineItems: LineItem[];
  summary: { headline: string; body: string };
  approveTitle: string;
  approveDescription: string;
}

/* ─── invoice data ─── */

const invoiceConfigs: Record<string, InvoiceConfig> = {
  "INV-4021": {
    id: "INV-4021",
    vendor: "Acme Corp",
    amount: 12450,
    received: "Feb 25, 2026",
    statusLabel: "Processed",
    statusIcon: CheckCircle,
    statusColor: "text-emerald-500",
    assignee: "Sarah Mitchell",
    matchScore: "94%",
    purchaseOrder: "PO-7710",
    paymentTerms: "Net 45",
    dueDate: "Apr 11, 2026",
    description:
      "Q1 2026 order for industrial bearings, hydraulic seals, and precision machining components for the Detroit manufacturing facility.",
    findings: [
      {
        icon: CircleAlert,
        label: "Duplicate line item detected",
        time: "5m ago",
        severity: "medium",
        description:
          "Line item #3 (Industrial Bearings, $2,400) appears to match a charge on INV-3987 from Jan 15...",
        detail: {
          headline:
            "Potential duplicate charge of $2,400 for Industrial Bearings",
          summary:
            "Line item #3 on this invoice (120× SKF-6205-2RS at $20.00 each, totaling $2,400.00) matches an identical charge on INV-3987, submitted by Acme Corp on January 15 and already approved for payment on January 22. Same vendor, same part number, same quantity and unit price. This could be a legitimate reorder for the Detroit facility, but the 41-day gap and identical amounts suggest it may be an accidental duplicate submission.",
          actions: [
            {
              label: "Mark as Duplicate",
              handler: {
                chatLoading:
                  "Marking line item #3 as duplicate across INV-4021 and INV-3987...",
                chatDone:
                  "Done — line item #3 (Industrial Bearings, $2,400.00) has been flagged as a duplicate. The charge has been excluded from the payment total. Updated invoice amount: $10,050.00.",
                timelineEntry:
                  "Line item #3 marked as duplicate — charge excluded from payment total.",
              },
            },
            { label: "Approve Anyway" },
          ],
        },
      },
      {
        icon: AlertTriangle,
        label: "Payment terms mismatch",
        time: "12m ago",
        severity: "low",
        description:
          "Invoice specifies Net 45, but vendor master record shows agreed terms of Net 30.",
        detail: {
          headline: "Payment terms discrepancy — Net 45 vs. agreed Net 30",
          summary:
            "This invoice from Acme Corp specifies payment terms of Net 45, but the vendor master record (VMR-AC-0042) shows mutually agreed terms of Net 30, last updated on November 8, 2025. Paying on Net 45 would delay payment by 15 days beyond the contractual obligation, which could trigger late payment penalties or affect the vendor relationship. This may be a clerical error on the invoice, or Acme Corp may have recently requested extended terms that haven't been reflected in the master record yet.",
          actions: [
            { label: "Use Agreed Net 30" },
            {
              label: "Accept Net 45",
              handler: {
                chatLoading: "Updating payment terms to Net 45 for INV-4021...",
                chatDone:
                  "Done — payment terms updated to Net 45. Due date adjusted to April 11, 2026. Vendor master record VMR-AC-0042 has been flagged for review to align with the updated terms.",
                timelineEntry:
                  "Payment terms updated to Net 45 — due date adjusted to Apr 11, 2026.",
              },
            },
            { label: "Contact Vendor" },
          ],
        },
      },
    ],
    timeline: [
      {
        text: "Three-way match completed — invoice, PO, and goods receipt verified.",
        time: "2m ago",
      },
      {
        text: "Goods receipt GRN-8842 confirmed for PO-7710.",
        time: "18m ago",
      },
      {
        text: "Invoice matched to purchase order PO-7710.",
        time: "22m ago",
      },
      {
        text: "Invoice received via EDI and entered into processing queue.",
        time: "1h ago",
      },
    ],
    lineItems: [
      {
        line: 1,
        description: "Industrial Bearings (SKF 6205)",
        partNo: "SKF-6205-2RS",
        qty: 120,
        unitPrice: 20.0,
        total: 2400.0,
      },
      {
        line: 2,
        description: "Hydraulic Cylinder Seals",
        partNo: "HCS-4450-KIT",
        qty: 50,
        unitPrice: 38.5,
        total: 1925.0,
      },
      {
        line: 3,
        description: "Precision Machined Shafts",
        partNo: "PMS-1020-SS",
        qty: 25,
        unitPrice: 185.0,
        total: 4625.0,
      },
      {
        line: 4,
        description: "Linear Guide Rails",
        partNo: "LGR-20-800",
        qty: 10,
        unitPrice: 245.0,
        total: 2450.0,
      },
      {
        line: 5,
        description: "Coupling Assemblies",
        partNo: "CA-30-FL",
        qty: 15,
        unitPrice: 70.0,
        total: 1050.0,
      },
    ],
    summary: {
      headline:
        "INV-4021 from Acme Corp has been fully processed and is ready for payment approval.",
      body: "The three-way match between the invoice, purchase order PO-7710, and goods receipt GRN-8842 was completed successfully. Two findings were flagged: a potential duplicate line item and a payment terms discrepancy. Neither is blocking, but both may warrant review before final approval.",
    },
    approveTitle: "Approve payment for INV-4021?",
    approveDescription:
      "This will authorize a payment of $12,450.00 to Acme Corp under purchase order PO-7710. Once confirmed, the payment will be queued for processing and cannot be reversed.",
  },

  "INV-4018": {
    id: "INV-4018",
    vendor: "Globex Inc",
    amount: 8230,
    received: "Feb 23, 2026",
    statusLabel: "In Review",
    statusIcon: Clock,
    statusColor: "text-amber-500",
    assignee: "David Chen",
    matchScore: "87%",
    purchaseOrder: "PO-8215",
    paymentTerms: "Net 30",
    dueDate: "Mar 25, 2026",
    description:
      "Q1 2026 order for electronic sensors, control modules, and calibration equipment for the Austin testing facility.",
    findings: [
      {
        icon: CircleAlert,
        label: "Quantity exceeds purchase order",
        time: "8m ago",
        severity: "medium",
        description:
          "Invoice shows 200× Proximity Sensors but PO-8215 authorized only 150 units. Overage of 50 units ($925.00).",
        detail: {
          headline:
            "Quantity overage of 50 units on Proximity Sensors — $925.00 above PO",
          summary:
            "Line item #1 on this invoice lists 200× Proximity Sensors (PS-200-IR) at $18.50 each, totaling $3,700.00. However, purchase order PO-8215 only authorized 150 units ($2,775.00). The overage of 50 units adds $925.00 beyond the approved amount. The Austin facility did request additional sensors in a follow-up email on Feb 18, but no PO amendment was filed. This may be a legitimate order increase that needs retroactive approval.",
          actions: [
            {
              label: "Adjust to PO Quantity",
              handler: {
                chatLoading:
                  "Adjusting line item #1 quantity from 200 to 150 per PO-8215...",
                chatDone:
                  "Done — line item #1 (Proximity Sensors) adjusted from 200 to 150 units. Charge reduced from $3,700.00 to $2,775.00. Updated invoice amount: $7,305.00.",
                timelineEntry:
                  "Line item #1 quantity adjusted to match PO — invoice amount updated.",
              },
            },
            { label: "Approve Overage" },
          ],
        },
      },
      {
        icon: AlertTriangle,
        label: "Missing goods receipt",
        time: "20m ago",
        severity: "low",
        description:
          "No goods receipt found for line items #3 and #4 (Control Modules and Calibration Kits).",
        detail: {
          headline:
            "Goods receipt missing for Control Modules and Calibration Kits",
          summary:
            "Line items #3 (Control Modules, CM-PLC-8X, $1,450.00) and #4 (Calibration Kits, CK-NIST-A, $760.00) have no corresponding goods receipt in the system. The warehouse receiving log for the Austin facility shows no delivery confirmation for these items as of Feb 23. The remaining items on the invoice (Proximity Sensors, Temperature Probes, Wiring Harnesses) were received and confirmed on Feb 21. These two items may still be in transit or delivered to a different dock.",
          actions: [
            { label: "Request GRN" },
            {
              label: "Waive Receipt",
              handler: {
                chatLoading:
                  "Waiving goods receipt requirement for line items #3 and #4...",
                chatDone:
                  "Done — goods receipt requirement waived for Control Modules and Calibration Kits. Manager approval logged. Items marked as received-in-system.",
                timelineEntry:
                  "Goods receipt waived for line items #3 and #4 — manager approval logged.",
              },
            },
            { label: "Contact Warehouse" },
          ],
        },
      },
    ],
    timeline: [
      {
        text: "Two-way match partial — PO verified, pending goods receipt.",
        time: "5m ago",
      },
      {
        text: "Quantity variance detected on line item #1.",
        time: "15m ago",
      },
      {
        text: "Invoice matched to purchase order PO-8215.",
        time: "28m ago",
      },
      {
        text: "Invoice received via email and entered into processing queue.",
        time: "2h ago",
      },
    ],
    lineItems: [
      {
        line: 1,
        description: "Proximity Sensors (IR)",
        partNo: "PS-200-IR",
        qty: 200,
        unitPrice: 18.5,
        total: 3700.0,
      },
      {
        line: 2,
        description: "Temperature Probes (K-type)",
        partNo: "TP-K-100",
        qty: 80,
        unitPrice: 24.0,
        total: 1920.0,
      },
      {
        line: 3,
        description: "Control Modules (PLC 8x)",
        partNo: "CM-PLC-8X",
        qty: 10,
        unitPrice: 145.0,
        total: 1450.0,
      },
      {
        line: 4,
        description: "Calibration Kits (NIST-A)",
        partNo: "CK-NIST-A",
        qty: 8,
        unitPrice: 95.0,
        total: 760.0,
      },
      {
        line: 5,
        description: "Wiring Harnesses (24-pin)",
        partNo: "WH-24-SH",
        qty: 20,
        unitPrice: 20.0,
        total: 400.0,
      },
    ],
    summary: {
      headline:
        "INV-4018 from Globex Inc is partially matched and awaiting goods receipt confirmation.",
      body: "The invoice has been matched to purchase order PO-8215, but two findings need attention: a quantity overage on proximity sensors and missing goods receipts for two line items. The match score is 87% — below the auto-approval threshold of 95%.",
    },
    approveTitle: "Approve payment for INV-4018?",
    approveDescription:
      "This will authorize a payment of $8,230.00 to Globex Inc under purchase order PO-8215. Once confirmed, the payment will be queued for processing and cannot be reversed.",
  },
};

/* ─── helpers ─── */

const tabs = ["All", "Findings", "Activity"] as const;
type Tab = (typeof tabs)[number];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ─── component ─── */

export function AnalyticsPage({
  visible,
  invoiceId = "INV-4021",
}: {
  visible: boolean;
  invoiceId?: string;
}) {
  const config = invoiceConfigs[invoiceId] ?? invoiceConfigs["INV-4021"];
  const StatusIcon = config.statusIcon;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [view, setView] = useState<"summary" | "table">("summary");
  const [selectedFinding, setSelectedFinding] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { text: string; status: "loading" | "done" }[]
  >([]);
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    new Set(),
  );
  const [timelineItems, setTimelineItems] = useState(config.timeline);
  const nav = useShellNavigation();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAction = useCallback((action: FindingAction) => {
    if (!action.handler) return;
    const h = action.handler;
    setCompletedActions((prev) => new Set(prev).add(action.label));
    setChatMessages((prev) => [
      ...prev,
      { text: h.chatLoading, status: "loading" },
    ]);
    setTimeout(() => {
      setChatMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, status: "done" as const } : m,
        ),
      );
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { text: h.chatDone, status: "done" },
        ]);
        setTimelineItems((prev) => [
          { text: h.timelineEntry, time: "Just now" },
          ...prev,
        ]);
      }, 800);
    }, 1500);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full relative z-10 pt-2">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => nav?.onNavigate("invoices")}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">{config.vendor}</h1>
            <p className="text-sm text-muted-foreground">{config.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-sm font-medium">{fmt(config.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Received</p>
            <p className="text-sm font-medium">{config.received}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex items-center gap-1.5">
              <StatusIcon className={cn("w-3.5 h-3.5", config.statusColor)} />
              <p className="text-sm font-medium">{config.statusLabel}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Assignee</p>
            <p className="text-sm font-medium">{config.assignee}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Match Score</p>
            <p className="text-sm font-medium">{config.matchScore}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "summary" | "table")}
            variant="outline"
          >
            <ToggleGroupItem value="summary">
              <Sparkles className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table">
              <Grid2x2 className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                style={{
                  boxShadow:
                    "0 0 16px color-mix(in oklch, var(--color-primary) 40%, transparent)",
                }}
              >
                Approve Payment
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{config.approveTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {config.approveDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    nav?.onNavigate("invoices");
                    setTimeout(() => {
                      toast.success(
                        `${config.id} approved — payment of ${fmt(config.amount)} to ${config.vendor} has been queued for processing.`,
                        { duration: 5000 },
                      );
                    }, 600);
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="flex-1 grid grid-cols-[380px_1fr_300px] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Left Panel Skeleton */}
            <div className="border-r border-border/50 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-12 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-14 rounded-md" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-3">
                  <Skeleton className="h-2 w-2 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-12" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-2 w-2 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-2 w-12" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-2 w-2 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/5" />
                    <Skeleton className="h-2 w-12" />
                  </div>
                </div>
              </div>
            </div>

            {/* Center Panel Skeleton */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-4/5" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            </div>

            {/* Right Panel Skeleton */}
            <div className="border-l border-border/50 p-6 space-y-5">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </motion.div>
        ) : view === "summary" ? (
          <motion.div
            key="summary"
            className="flex-1 grid grid-cols-[380px_1fr_300px] overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Left Panel — Notifications */}
            <div className="relative border-r border-border/50 overflow-hidden">
              <div className="overflow-y-auto h-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold">Notifications</h2>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Recent</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        activeTab === tab
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Findings */}
                {(activeTab === "All" || activeTab === "Findings") && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                      Findings
                    </h3>
                    <div className="space-y-3 mb-8">
                      {config.findings.map((finding, i) => (
                        <div
                          key={finding.label}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedFinding((prev) =>
                              prev === i ? null : i,
                            );
                            setChatMessages([]);
                            setCompletedActions(new Set());
                          }}
                          className={cn(
                            "p-3 rounded-lg border transition-colors cursor-pointer",
                            selectedFinding === i
                              ? "border-primary bg-primary/5"
                              : "border-border/50 bg-card/50",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <finding.icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {finding.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {finding.time}
                              </span>
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  finding.severity === "medium"
                                    ? "bg-warning"
                                    : "bg-muted-foreground/50",
                                )}
                              />
                            </div>
                          </div>
                          {finding.description && (
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              {finding.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Activity Timeline */}
                {(activeTab === "All" || activeTab === "Activity") && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                      Activity timeline
                    </h3>
                    <div className="space-y-0">
                      {timelineItems.map((item, i) => (
                        <div key={i} className="flex gap-3 pb-6 relative">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1.5 shrink-0" />
                            {i < timelineItems.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed">
                              {item.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[88px] bg-gradient-to-t from-background to-transparent z-10" />
            </div>

            {/* Center Panel — AI Summary */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto py-6 pl-6 pr-12">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-sm font-semibold">AI Summary</h2>
                    <span className="text-xs text-muted-foreground">
                      2m ago
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    {selectedFinding !== null &&
                    config.findings[selectedFinding]?.detail ? (
                      <motion.div
                        key={`finding-${selectedFinding}`}
                        className="space-y-4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <h2 className="text-2xl font-semibold leading-tight">
                          {config.findings[selectedFinding].detail.headline}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {config.findings[selectedFinding].detail.summary}
                        </p>
                        <div className="flex gap-2 pt-2">
                          {config.findings[selectedFinding].detail.actions.map(
                            (action) => {
                              const isActive = completedActions.has(
                                action.label,
                              );
                              return (
                                <Button
                                  key={action.label}
                                  variant="outline"
                                  size="sm"
                                  onClick={
                                    action.handler
                                      ? () => handleAction(action)
                                      : undefined
                                  }
                                  disabled={isActive}
                                  className={
                                    isActive
                                      ? "bg-accent/80 text-accent-foreground"
                                      : undefined
                                  }
                                >
                                  {action.label}
                                </Button>
                              );
                            },
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="default-summary"
                        className="space-y-4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <h2 className="text-2xl font-semibold leading-tight">
                          {config.summary.headline}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {config.summary.body}
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            Review Findings
                          </Button>
                          <Button variant="outline" size="sm">
                            Approve Payment
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Chat Messages */}
                {chatMessages.length > 0 && (
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        className="flex gap-3 items-start"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="mt-0.5 shrink-0">
                          {msg.status === "loading" ? (
                            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="px-6 pb-6">
                <div className="relative rounded-xl border border-border/50 bg-card/50">
                  <textarea
                    placeholder="Ask about this invoice..."
                    className="w-full resize-none rounded-xl bg-transparent px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none min-h-[80px]"
                    rows={2}
                  />
                  <button
                    type="button"
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel — Invoice Details */}
            <div className="border-l border-border/50 overflow-y-auto p-6">
              <h2 className="text-sm font-semibold mb-6">Invoice Details</h2>

              <div className="space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Invoice amount
                  </p>
                  <p className="text-lg font-bold">{fmt(config.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Vendor</p>
                  <p className="text-sm font-semibold">{config.vendor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Purchase order
                  </p>
                  <p className="text-sm font-semibold">
                    {config.purchaseOrder}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Payment terms
                  </p>
                  <p className="text-sm font-semibold">{config.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Due date
                  </p>
                  <p className="text-sm font-semibold">{config.dueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            className="flex-1 overflow-y-auto p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h2 className="text-sm font-semibold mb-4">Line Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Line</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Part No.</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.lineItems.map((item) => (
                  <TableRow key={item.line}>
                    <TableCell className="text-muted-foreground">
                      {item.line}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {item.partNo}
                    </TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">
                      {fmt(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} />
                  <TableCell className="text-right text-sm text-muted-foreground">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt(config.amount)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} />
                  <TableCell className="text-right text-sm text-muted-foreground">
                    Tax (0%)
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    $0.00
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} />
                  <TableCell className="text-right text-sm font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold">
                    {fmt(config.amount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
