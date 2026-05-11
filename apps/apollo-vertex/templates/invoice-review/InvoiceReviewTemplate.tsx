"use client";

import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Settings2,
  Sparkle,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableColumnHeader,
  dataTableFacetedFilterFn,
  dataTableGlobalFilterFn,
} from "@/components/ui/data-table";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { MetricCard } from "@/components/ui/metric-card";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { ApolloShell } from "@/components/ui/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Toaster } from "@/registry/sonner/sonner";
import { useDataTable } from "@/registry/use-data-table/useDataTable";

// ── Data ─────────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  vendor: string;
  amount: string;
  tag?: string;
  tagType?: "error" | "warning" | "info";
  score: number;
  status?: "done";
  dueGroup: "today" | "tomorrow" | "auto";
}

type ExceptionType =
  | "price-mismatch"
  | "high-value"
  | "no-po-match"
  | "duplicate"
  | "missing-po"
  | "new-vendor"
  | "none";
type InvoiceStatus =
  | "pending-review"
  | "in-review"
  | "approved"
  | "rejected"
  | "sent-for-approval";

interface InvoiceTableRow {
  id: string;
  vendor: string;
  amount: number;
  currency: "USD" | "EUR" | "GBP" | "CAD";
  dueDate: string;
  exception: ExceptionType;
  score: number;
  status: InvoiceStatus;
  assignee: string;
}

interface InvoiceDetailData {
  id: string;
  vendor: string;
  vendorEmail: string;
  amount: string;
  currency: string;
  dueDate: string;
  dueFormatted: string;
  documentDateFormatted: string;
  po: string;
  paymentTerms: string;
  billTo: string;
  billAddress: string;
  assignee: string;
  assigneeInitials: string;
  vat: string;
  description: string;
  exceptionTag: string;
  exceptionTagStatus: "error" | "warning" | "info";
  exceptionHeadline: string;
  exceptionMetrics: { label: string; value: string; cls: string }[];
  exceptionBody: string;
  exceptionPrimaryAction: string;
  exceptionSecondaryAction: string;
  lines: {
    description: string;
    qty: number;
    amount: string;
    flag?: string;
    flagStatus?: "error" | "warning";
    agreed?: string;
  }[];
  linesTotal: string;
  linesAlert?: { text: string; status: "error" | "warning" };
  sourceFilename: string;
  sourceLines: string[];
}

interface SentEmail {
  to: string;
  cc: string;
  subject: string;
  body: string;
  sentAt: string;
}

const detailDataMap: Record<string, InvoiceDetailData> = {
  "INV-GRN-001": {
    id: "INV-GRN-001",
    vendor: "ACME Industrial",
    vendorEmail: "accounts@acmeindustrial.com",
    amount: "$694.39 USD",
    currency: "USD",
    dueDate: "2026-05-10",
    dueFormatted: "May 10, 2026",
    documentDateFormatted: "Apr 10, 2026",
    po: "PO-460035919",
    paymentTerms: "Net 30 · USD",
    billTo: "Global Enterprises Inc",
    billAddress: "800 Corporate Center, Chicago IL 60601",
    assignee: "Alex Johnson",
    assigneeInitials: "AJ",
    vat: "—",
    description:
      "USB peripherals for Q4 office refresh. Single-line invoice for bulk USB hubs supplied under blanket PO-460035919.",
    exceptionTag: "Price mismatch",
    exceptionTagStatus: "error",
    exceptionHeadline: "USB Hub invoiced above agreed price",
    exceptionMetrics: [
      { label: "Invoiced", value: "$694.39", cls: "text-foreground" },
      { label: "PO agreed", value: "$689.55", cls: "text-foreground" },
      { label: "Difference", value: "-$4.84", cls: "text-[#C0392B]" },
    ],
    exceptionBody:
      "Supplier agreed to discounted price per PO note — invoice reflects original price. Request a corrected invoice from ACME Industrial before approving.",
    exceptionPrimaryAction: "Contact supplier",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "USB Hub — 7 Port Powered",
        qty: 1,
        amount: "$694.39",
        flag: "↑ price",
        flagStatus: "error",
        agreed: "$689.55",
      },
    ],
    linesTotal: "$694.39",
    linesAlert: {
      text: "Price exceeds PO by $4.84 — could not auto-resolve.",
      status: "error",
    },
    sourceFilename: "INV-GRN-001.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-GRN-001",
      "Date: October 5, 2025",
      "Due: November 2, 2025",
      "---",
      "From:",
      "ACME Industrial Supply",
      "123 Industrial Way",
      "Detroit, MI 48201",
      "---",
      "Bill To:",
      "Global Enterprises Inc",
      "800 Corporate Center",
      "Chicago, IL 60601",
      "---",
      "Items:",
      "USB Hub 7-Port × 1 · $694.39",
      "---",
      "Total: $694.39",
    ],
  },
  "INV-66216": {
    id: "INV-66216",
    vendor: "Prime Office Solutions",
    vendorEmail: "billing@primeoffice.com",
    amount: "$65,800.00 USD",
    currency: "USD",
    dueDate: "2026-05-09",
    dueFormatted: "May 9, 2026",
    documentDateFormatted: "Apr 9, 2026",
    po: "PO-820044712",
    paymentTerms: "Net 45 · USD",
    billTo: "Global Enterprises Inc",
    billAddress: "800 Corporate Center, Chicago IL 60601",
    assignee: "Maria Chen",
    assigneeInitials: "MC",
    vat: "US-82-4471200",
    description:
      "Office furniture and ergonomic equipment for Chicago headquarters expansion. Covers 20 new workstations with chairs, standing desks, and monitor arms.",
    exceptionTag: "High value",
    exceptionTagStatus: "warning",
    exceptionHeadline: "Office furniture order above auto-approval limit",
    exceptionMetrics: [
      { label: "Amount", value: "$65,800", cls: "text-foreground" },
      { label: "Threshold", value: "$50,000", cls: "text-foreground" },
      { label: "Excess", value: "+$15,800", cls: "text-[#EF9F27]" },
    ],
    exceptionBody:
      "Invoice exceeds the $50,000 automated approval threshold. CFO or VP Finance sign-off is required before this payment can be processed.",
    exceptionPrimaryAction: "Request approval",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      { description: "Ergonomic desk chair", qty: 20, amount: "$38,000.00" },
      {
        description: "Height-adjustable standing desk",
        qty: 10,
        amount: "$24,000.00",
      },
      {
        description: "Monitor arm (dual)",
        qty: 30,
        amount: "$3,800.00",
        flag: "high value",
        flagStatus: "warning",
      },
    ],
    linesTotal: "$65,800.00",
    linesAlert: {
      text: "Total exceeds $50,000 threshold — CFO approval required before payment.",
      status: "warning",
    },
    sourceFilename: "INV-66216.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-66216",
      "Date: November 20, 2025",
      "Due: December 15, 2025",
      "---",
      "From:",
      "Prime Office Solutions",
      "4400 Commerce Blvd",
      "Atlanta, GA 30339",
      "---",
      "Bill To:",
      "Global Enterprises Inc",
      "800 Corporate Center",
      "Chicago, IL 60601",
      "---",
      "Items:",
      "Ergonomic desk chair × 20 · $38,000.00",
      "Standing desk × 10 · $24,000.00",
      "Monitor arm × 30 · $3,800.00",
      "---",
      "Total: $65,800.00",
    ],
  },
  "INV-84471": {
    id: "INV-84471",
    vendor: "Acme Supply Co.",
    vendorEmail: "ar@acmesupply.co",
    amount: "$12,240.00 USD",
    currency: "USD",
    dueDate: "2026-05-14",
    dueFormatted: "May 14, 2026",
    documentDateFormatted: "Apr 14, 2026",
    po: "—",
    paymentTerms: "Net 30 · USD",
    billTo: "Lakewood Manufacturing",
    billAddress: "1 Industrial Park Rd, Cleveland OH 44101",
    assignee: "Alex Johnson",
    assigneeInitials: "AJ",
    vat: "—",
    description:
      "Quarterly facility maintenance supplies for the Cleveland manufacturing plant, including janitorial consumables and floor cleaning equipment.",
    exceptionTag: "No PO match",
    exceptionTagStatus: "error",
    exceptionHeadline: "Facility supplies submitted without purchase order",
    exceptionMetrics: [
      { label: "Invoiced", value: "$12,240", cls: "text-foreground" },
      { label: "POs matched", value: "0", cls: "text-[#C0392B]" },
    ],
    exceptionBody:
      "No purchase order found matching this invoice. Contact the facilities manager to confirm whether supplies were ordered, or reject and request a PO-backed resubmission.",
    exceptionPrimaryAction: "Contact requester",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "Janitorial supply kit",
        qty: 12,
        amount: "$4,080.00",
        flag: "no PO",
        flagStatus: "error",
      },
      {
        description: "Floor cleaning solution (5L)",
        qty: 24,
        amount: "$3,360.00",
        flag: "no PO",
        flagStatus: "error",
      },
      {
        description: "Industrial waste bags (case)",
        qty: 60,
        amount: "$4,800.00",
        flag: "no PO",
        flagStatus: "error",
      },
    ],
    linesTotal: "$12,240.00",
    linesAlert: {
      text: "No matching PO found — payment blocked until a valid PO is provided.",
      status: "error",
    },
    sourceFilename: "INV-84471.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-84471",
      "Date: October 30, 2025",
      "Due: November 28, 2025",
      "---",
      "From:",
      "Acme Supply Co.",
      "78 Warehouse Drive",
      "Columbus, OH 43215",
      "---",
      "Bill To:",
      "Lakewood Manufacturing",
      "1 Industrial Park Rd",
      "Cleveland, OH 44101",
      "---",
      "Items:",
      "Janitorial supply kit × 12 · $4,080.00",
      "Floor cleaning solution × 24 · $3,360.00",
      "Industrial waste bags × 60 · $4,800.00",
      "---",
      "Total: $12,240.00",
    ],
  },
  "INV-91003": {
    id: "INV-91003",
    vendor: "NorthStar LLC",
    vendorEmail: "invoices@northstarllc.co.uk",
    amount: "£8,750.00 GBP",
    currency: "GBP",
    dueDate: "2026-05-21",
    dueFormatted: "May 21, 2026",
    documentDateFormatted: "Apr 21, 2026",
    po: "PO-NL-20250093",
    paymentTerms: "Net 60 · GBP",
    billTo: "UiPath UK Ltd",
    billAddress: "1 Knightsbridge, London SW1X 7LX",
    assignee: "James Park",
    assigneeInitials: "JP",
    vat: "GB-294-8821-33",
    description:
      "Strategic advisory services for Q4 2025 product roadmap review and stakeholder alignment workshops, delivered by NorthStar LLC.",
    exceptionTag: "High value",
    exceptionTagStatus: "warning",
    exceptionHeadline: "Consulting services invoice exceeds approval threshold",
    exceptionMetrics: [
      { label: "Invoiced", value: "£8,750", cls: "text-foreground" },
      { label: "Threshold", value: "£5,000", cls: "text-foreground" },
      { label: "Excess", value: "+£3,750", cls: "text-[#EF9F27]" },
    ],
    exceptionBody:
      "Consulting invoice exceeds the £5,000 approval threshold for professional services. Department head sign-off is required per policy before payment can proceed.",
    exceptionPrimaryAction: "Request sign-off",
    exceptionSecondaryAction: "Approve",
    lines: [
      {
        description: "Strategic roadmap review (20h × £275)",
        qty: 1,
        amount: "£5,500.00",
      },
      {
        description: "Stakeholder workshop facilitation",
        qty: 1,
        amount: "£3,250.00",
        flag: "high value",
        flagStatus: "warning",
      },
    ],
    linesTotal: "£8,750.00",
    linesAlert: {
      text: "Total exceeds £5,000 consulting threshold — department head sign-off required.",
      status: "warning",
    },
    sourceFilename: "INV-91003.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-91003",
      "Date: November 15, 2025",
      "Due: December 31, 2025",
      "---",
      "From:",
      "NorthStar LLC",
      "22 Canary Wharf",
      "London E14 5AB",
      "---",
      "Bill To:",
      "UiPath UK Ltd",
      "1 Knightsbridge",
      "London SW1X 7LX",
      "---",
      "Items:",
      "Strategic roadmap review × 1 · £5,500.00",
      "Workshop facilitation × 1 · £3,250.00",
      "---",
      "Total: £8,750.00",
    ],
  },
};

const InvoiceDetailContext = createContext<InvoiceDetailData>(
  detailDataMap["INV-GRN-001"] as InvoiceDetailData,
);
const useInvoiceDetail = () => useContext(InvoiceDetailContext);

const invoicesReview: Invoice[] = [
  {
    id: "INV-GRN-001",
    vendor: "ACME Industrial",
    amount: "$694",
    tag: "Price mismatch",
    tagType: "error",
    score: 3,
    dueGroup: "today",
  },
  {
    id: "INV-66216",
    vendor: "Prime Office Solutions",
    amount: "$65,800",
    tag: "High value",
    tagType: "warning",
    score: 4,
    dueGroup: "today",
  },
  {
    id: "INV-84471",
    vendor: "Acme Supply Co.",
    amount: "$12,240",
    tag: "No PO match",
    tagType: "error",
    score: 2,
    dueGroup: "today",
  },
  {
    id: "INV-91003",
    vendor: "NorthStar LLC",
    amount: "£8,750",
    tag: "High value",
    tagType: "warning",
    score: 4,
    dueGroup: "today",
  },
  {
    id: "INV-77294",
    vendor: "Vertex Supplies Inc.",
    amount: "$3,180",
    tag: "Duplicate flag",
    tagType: "warning",
    score: 3,
    dueGroup: "tomorrow",
  },
  {
    id: "INV-55832",
    vendor: "Meridian Group",
    amount: "€22,500",
    tag: "High value",
    tagType: "warning",
    score: 4,
    dueGroup: "tomorrow",
  },
  {
    id: "INV-60118",
    vendor: "Crestwood Co.",
    amount: "$940",
    tag: "Missing PO",
    tagType: "error",
    score: 2,
    dueGroup: "tomorrow",
  },
  {
    id: "INV-48209",
    vendor: "Folio Systems",
    amount: "$7,620",
    tag: "New vendor",
    tagType: "info",
    score: 4,
    dueGroup: "tomorrow",
  },
];

const dueTodayInvoices = invoicesReview.filter(
  (inv) => inv.dueGroup === "today",
);

const invoicesAuto: Invoice[] = [
  {
    id: "INV-39471",
    vendor: "Delta Corp",
    amount: "$4,100",
    score: 5,
    status: "done",
    dueGroup: "auto",
  },
  {
    id: "INV-38820",
    vendor: "Ironside Ltd",
    amount: "$2,900",
    score: 5,
    status: "done",
    dueGroup: "auto",
  },
  {
    id: "INV-38441",
    vendor: "Bluewave Tech",
    amount: "€1,850",
    score: 5,
    status: "done",
    dueGroup: "auto",
  },
  {
    id: "INV-37990",
    vendor: "Harmon & Associates",
    amount: "$6,400",
    score: 5,
    status: "done",
    dueGroup: "auto",
  },
  {
    id: "INV-36884",
    vendor: "Summit Procurement",
    amount: "$14,100",
    score: 5,
    status: "done",
    dueGroup: "auto",
  },
  {
    id: "INV-36502",
    vendor: "Clearpath Solutions",
    amount: "€920",
    score: 5,
    status: "done",
    dueGroup: "auto",
  },
];

const invoiceTableData: InvoiceTableRow[] = [
  {
    id: "INV-GRN-001",
    vendor: "ACME Industrial",
    amount: 694,
    currency: "USD",
    dueDate: "2026-05-06",
    exception: "price-mismatch",
    score: 3,
    status: "pending-review",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-66216",
    vendor: "Prime Office Solutions",
    amount: 65800,
    currency: "USD",
    dueDate: "2026-05-06",
    exception: "high-value",
    score: 4,
    status: "in-review",
    assignee: "Maria Chen",
  },
  {
    id: "INV-84471",
    vendor: "Acme Supply Co.",
    amount: 12240,
    currency: "USD",
    dueDate: "2026-05-06",
    exception: "no-po-match",
    score: 2,
    status: "pending-review",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-91003",
    vendor: "NorthStar LLC",
    amount: 8750,
    currency: "GBP",
    dueDate: "2026-05-06",
    exception: "high-value",
    score: 4,
    status: "in-review",
    assignee: "James Park",
  },
  {
    id: "INV-77294",
    vendor: "Vertex Supplies Inc.",
    amount: 3180,
    currency: "USD",
    dueDate: "2026-05-07",
    exception: "duplicate",
    score: 3,
    status: "pending-review",
    assignee: "Maria Chen",
  },
  {
    id: "INV-55832",
    vendor: "Meridian Group",
    amount: 22500,
    currency: "EUR",
    dueDate: "2026-05-07",
    exception: "high-value",
    score: 4,
    status: "in-review",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-60118",
    vendor: "Crestwood Co.",
    amount: 940,
    currency: "USD",
    dueDate: "2026-05-07",
    exception: "missing-po",
    score: 2,
    status: "pending-review",
    assignee: "James Park",
  },
  {
    id: "INV-48209",
    vendor: "Folio Systems",
    amount: 7620,
    currency: "USD",
    dueDate: "2026-05-07",
    exception: "new-vendor",
    score: 4,
    status: "in-review",
    assignee: "Maria Chen",
  },
  {
    id: "INV-22045",
    vendor: "Starlight Corp",
    amount: 18400,
    currency: "CAD",
    dueDate: "2026-05-08",
    exception: "none",
    score: 5,
    status: "approved",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-23801",
    vendor: "TechForce Ltd",
    amount: 5250,
    currency: "USD",
    dueDate: "2026-05-08",
    exception: "high-value",
    score: 4,
    status: "in-review",
    assignee: "Maria Chen",
  },
  {
    id: "INV-24990",
    vendor: "Evergreen Partners",
    amount: 320,
    currency: "EUR",
    dueDate: "2026-05-09",
    exception: "none",
    score: 5,
    status: "approved",
    assignee: "James Park",
  },
  {
    id: "INV-25114",
    vendor: "Cascade Solutions",
    amount: 44200,
    currency: "USD",
    dueDate: "2026-05-09",
    exception: "high-value",
    score: 3,
    status: "pending-review",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-26332",
    vendor: "Parity Group",
    amount: 1880,
    currency: "GBP",
    dueDate: "2026-05-10",
    exception: "duplicate",
    score: 2,
    status: "rejected",
    assignee: "Maria Chen",
  },
  {
    id: "INV-27009",
    vendor: "Apex Distributors",
    amount: 9700,
    currency: "USD",
    dueDate: "2026-05-10",
    exception: "no-po-match",
    score: 3,
    status: "in-review",
    assignee: "James Park",
  },
  {
    id: "INV-28441",
    vendor: "Summit Logistics",
    amount: 3400,
    currency: "CAD",
    dueDate: "2026-05-11",
    exception: "none",
    score: 5,
    status: "approved",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-29553",
    vendor: "Waveline Inc.",
    amount: 16300,
    currency: "USD",
    dueDate: "2026-05-11",
    exception: "price-mismatch",
    score: 3,
    status: "pending-review",
    assignee: "Maria Chen",
  },
  {
    id: "INV-30012",
    vendor: "Falcon Procurement",
    amount: 7100,
    currency: "EUR",
    dueDate: "2026-05-12",
    exception: "missing-po",
    score: 2,
    status: "pending-review",
    assignee: "James Park",
  },
  {
    id: "INV-31887",
    vendor: "Ironclad Services",
    amount: 51000,
    currency: "USD",
    dueDate: "2026-05-12",
    exception: "high-value",
    score: 4,
    status: "in-review",
    assignee: "Alex Johnson",
  },
  {
    id: "INV-32240",
    vendor: "Cobalt Industries",
    amount: 2200,
    currency: "GBP",
    dueDate: "2026-05-13",
    exception: "new-vendor",
    score: 3,
    status: "in-review",
    assignee: "Maria Chen",
  },
  {
    id: "INV-33905",
    vendor: "Lighthouse LLC",
    amount: 890,
    currency: "USD",
    dueDate: "2026-05-13",
    exception: "none",
    score: 5,
    status: "approved",
    assignee: "James Park",
  },
];

type RightTab = "details" | "lines" | "source" | "comms" | "activity";
type Variant = "A" | "B" | "C";

const BETWEEN_INVOICE_STYLES = `
  @keyframes inv-between-enter {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .inv-between-enter {
    animation: inv-between-enter 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }
  @keyframes inv-between-exit {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-40px); }
  }
  .inv-between-exit {
    animation: inv-between-exit 220ms cubic-bezier(0.4, 0, 1, 1) both;
    pointer-events: none;
  }
  @keyframes detail-slide-in {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .detail-slide-in {
    animation: detail-slide-in 320ms cubic-bezier(0.4, 0, 0.2, 1) 80ms both;
  }
  @keyframes skeleton-content-enter {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .skeleton-content-enter {
    animation: skeleton-content-enter 300ms ease-out both;
  }
  @keyframes inv-glow-in {
    from { opacity: 0; }
    to   { opacity: 0.04; }
  }
  .inv-glow-in {
    animation: inv-glow-in 800ms ease-out 540ms both;
  }
`;

// ── Primitives ────────────────────────────────────────────────────────────────

function ScoreBar({
  passed,
  failed,
  skipped,
}: {
  passed: number;
  failed: number;
  skipped: number;
}) {
  const segments: Array<"pass" | "fail" | "skip"> = [
    ...Array<"pass">(passed).fill("pass"),
    ...Array<"fail">(failed).fill("fail"),
    ...Array<"skip">(skipped).fill("skip"),
  ];
  return (
    <div className="flex gap-[2px] items-center shrink-0">
      {segments.map((type, i) => (
        <div
          key={i}
          className={cn(
            "w-[10px] h-[4px] rounded-[2px]",
            type === "pass" && "bg-[#97C459]",
            type === "fail" && "bg-[#E24B4A]",
            type === "skip" && "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function formatAmount(
  amount: number,
  currency: InvoiceTableRow["currency"],
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const exceptionBadgeMap: Record<
  ExceptionType,
  { label: string; status: "error" | "warning" | "info" | null }
> = {
  "price-mismatch": { label: "Price mismatch", status: "error" },
  "high-value": { label: "High value", status: "warning" },
  "no-po-match": { label: "No PO match", status: "error" },
  duplicate: { label: "Duplicate", status: "warning" },
  "missing-po": { label: "Missing PO", status: "error" },
  "new-vendor": { label: "New vendor", status: "info" },
  none: { label: "—", status: null },
};

const statusBadgeMap: Record<
  InvoiceStatus,
  { label: string; status: "info" | "warning" | "success" | "error" }
> = {
  "pending-review": { label: "Pending review", status: "warning" },
  "in-review": { label: "In review", status: "info" },
  approved: { label: "Approved", status: "success" },
  rejected: { label: "Rejected", status: "error" },
  "sent-for-approval": { label: "Sent for approval", status: "info" },
};

const timeFilterOptions = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "This year", value: "1y" },
];

const exceptionFilterOptions = [
  { label: "Price mismatch", value: "price-mismatch" },
  { label: "High value", value: "high-value" },
  { label: "No PO match", value: "no-po-match" },
  { label: "Duplicate", value: "duplicate" },
  { label: "Missing PO", value: "missing-po" },
  { label: "New vendor", value: "new-vendor" },
  { label: "None", value: "none" },
];

const statusFilterOptions = [
  { label: "Pending review", value: "pending-review" },
  { label: "In review", value: "in-review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const exceptionPriority: Partial<Record<ExceptionType, number>> = {
  "no-po-match": 2,
  "missing-po": 2,
  duplicate: 2,
  "price-mismatch": 1,
  "high-value": 1,
  "new-vendor": 1,
};

const invoiceColumns: ColumnDef<InvoiceTableRow>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue<string>("id")}</span>
    ),
  },
  {
    accessorKey: "vendor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatAmount(row.getValue<number>("amount"), row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due date" />
    ),
    cell: ({ row }) => {
      const iso = row.getValue<string>("dueDate");
      const date = new Date(`${iso}T00:00:00`);
      const formatted = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
      return (
        <span className="tabular-nums text-[13px] text-muted-foreground">
          {formatted}
        </span>
      );
    },
  },
  {
    accessorKey: "exception",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Exception" />
    ),
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- filterFn is Row<RowData> but compatible at runtime
    filterFn: dataTableFacetedFilterFn as FilterFn<InvoiceTableRow>,
    cell: ({ row }) => {
      const ex = row.getValue<ExceptionType>("exception");
      const map = exceptionBadgeMap[ex];
      if (map.status === null)
        return <span className="text-[13px] text-muted-foreground">5/5</span>;
      return (
        <Badge variant="secondary" status={map.status}>
          {map.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- filterFn is Row<RowData> but compatible at runtime
    filterFn: dataTableFacetedFilterFn as FilterFn<InvoiceTableRow>,
    cell: ({ row }) => {
      const s = row.getValue<InvoiceStatus>("status");
      const map = statusBadgeMap[s];
      return (
        <Badge variant="secondary" status={map.status}>
          {map.label}
        </Badge>
      );
    },
  },
];

function AvatarChip({ type }: { type: "ai-pass" | "ai-fail" | "user" }) {
  const isAI = type === "ai-pass" || type === "ai-fail";
  return (
    <div
      className={cn(
        "size-[14px] rounded-full flex items-center justify-center shrink-0",
        isAI && "bg-gradient-to-br from-[#7C6AF5] to-[#5B8EF0]",
        type === "user" && "bg-muted-foreground",
      )}
    >
      {isAI ? (
        <Sparkle
          className="size-[8px] text-background"
          fill="currentColor"
          strokeWidth={0}
        />
      ) : (
        <span className="text-[7px] font-bold text-white">A</span>
      )}
    </div>
  );
}

// ── DetailSkeleton ────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <>
      {/* TopBar skeleton */}
      <div className="border-b border-border min-h-[92px] flex flex-col justify-center px-4 sm:px-6 lg:px-8 shrink-0">
        <Skeleton className="h-5 w-44 mb-3" />
        <div className="flex gap-8">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      {/* Activity bar skeleton */}
      <div className="h-10 border-b border-border flex items-center px-4 sm:px-6 lg:px-8 shrink-0">
        <Skeleton className="h-3 w-64" />
      </div>
      {/* Content + right panel skeleton */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-8 w-80" />
          <div className="flex gap-8 pt-1">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-3/4 max-w-[340px]" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="w-96 border-l border-border px-5 py-5 space-y-5 shrink-0">
          <div className="flex gap-6 border-b border-border pb-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="h-px bg-border/20" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </>
  );
}

// ── InvoiceListView ───────────────────────────────────────────────────────────

const LIST_COLUMN_ORDER = [
  "id",
  "vendor",
  "amount",
  "dueDate",
  "exception",
  "status",
];
const LIST_VISIBLE_COLUMNS = [
  "id",
  "vendor",
  "amount",
  "dueDate",
  "exception",
  "status",
];

function InvoiceListView({ onRowClick }: { onRowClick: (id: string) => void }) {
  const [timeRange, setTimeRange] = useState("30d");

  const sortedData = useMemo(() => {
    return [...invoiceTableData].sort((a, b) => {
      const pa = exceptionPriority[a.exception] ?? 0;
      const pb = exceptionPriority[b.exception] ?? 0;
      if (pa !== pb) return pb - pa;
      return a.score - b.score;
    });
  }, []);

  const tableState = useDataTable({
    data: sortedData,
    columns: invoiceColumns,
    storageKey: "invoice-review-list-v6",
    defaultColumnOrder: LIST_COLUMN_ORDER,
    defaultVisibleColumns: LIST_VISIBLE_COLUMNS,
  });

  const todayISO = new Date().toISOString().slice(0, 10);
  const pendingCount = invoiceTableData.filter(
    (r) => r.status === "pending-review" || r.status === "in-review",
  ).length;
  const dueTodayCount = invoiceTableData.filter(
    (r) => r.dueDate === todayISO,
  ).length;
  const exceptCount = invoiceTableData.filter(
    (r) => r.exception !== "none",
  ).length;
  const autoCount = invoicesAuto.length;
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- filterFn is Row<RowData> but compatible at runtime
  const typedGlobalFilterFn =
    dataTableGlobalFilterFn as FilterFn<InvoiceTableRow>;

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitle>Invoices</PageHeaderTitle>
        </PageHeaderNav>
        <PageHeaderActions>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            className="size-9"
          >
            <RefreshCw className="size-4" />
          </Button>
          <FilterDropdown
            title="Time"
            options={timeFilterOptions}
            multiSelect={false}
            value={timeRange}
            onChange={(v) => {
              if (typeof v === "string") setTimeRange(v);
            }}
          />
          <Button>Upload Invoice</Button>
        </PageHeaderActions>
      </PageHeader>
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-4 mb-8">
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard label="Pending review" value={pendingCount} />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard label="Due today" value={dueTodayCount} />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard label="Exceptions flagged" value={exceptCount} />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard label="Auto-approved" value={autoCount} />
          </div>
        </div>
        <DataTable
          {...tableState}
          globalFilterFn={typedGlobalFilterFn}
          onRowClick={(row) => onRowClick(row.id)}
          getRowClassName={(row) => (row.score === 5 ? "opacity-[0.35]" : "")}
          toolbarContent={(table) => (
            <>
              <FilterDropdown
                column={table.getColumn("exception")}
                title="Exception"
                options={exceptionFilterOptions}
              />
              <FilterDropdown
                column={table.getColumn("status")}
                title="Status"
                options={statusFilterOptions}
              />
            </>
          )}
        />
      </div>
    </div>
  );
}

// ── LeftNav ───────────────────────────────────────────────────────────────────

function NavSectionLabel({
  label,
  count,
  first = false,
}: {
  label: string;
  count?: number;
  first?: boolean;
}) {
  return (
    <div className={cn("px-6 pb-2", first ? "pt-4" : "pt-5")}>
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
        {count !== undefined && <span className="ml-1">({count})</span>}
      </span>
    </div>
  );
}

function NavInvoiceItem({
  invoice,
  isActive,
  onClick,
}: {
  invoice: Invoice;
  isActive: boolean;
  onClick: () => void;
}) {
  const isAuto = invoice.status === "done";

  const dotColor = isAuto
    ? "bg-[#97C459]"
    : invoice.tagType === "error"
      ? "bg-[#E24B4A]"
      : invoice.tagType === "warning"
        ? "bg-[#EF9F27]"
        : invoice.tagType === "info"
          ? "bg-[#5B8EF0]"
          : "bg-muted-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full text-left group", isAuto && "opacity-40")}
    >
      <div
        className={cn(
          "mx-6 px-[14px] py-[13px] rounded-md transition-colors",
          "bg-white/55 dark:bg-white/[0.055]",
          "backdrop-blur-sm",
          "shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)]",
          "dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)]",
          isActive
            ? "border-[1.5px] border-primary"
            : "border border-white/80 dark:border-white/[0.03] group-hover:bg-white/70 dark:group-hover:bg-white/[0.08]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-foreground truncate">
            {invoice.vendor}
          </span>
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            {invoice.amount}
          </span>
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          {(invoice.tag || isAuto) && (
            <div className="flex items-center gap-1 shrink-0">
              <div className={cn("size-1.5 rounded-full shrink-0", dotColor)} />
              <span className="text-xs text-muted-foreground">
                {isAuto ? "Done" : invoice.tag}
              </span>
            </div>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {invoice.id}
          </span>
        </div>
      </div>
    </button>
  );
}

function LeftNav({
  activeId,
  onInvoiceClick,
  onBack,
  variant,
  onVariantChange,
}: {
  activeId: string;
  onInvoiceClick: (id: string) => void;
  onBack: () => void;
  variant: Variant;
  onVariantChange: (v: Variant) => void;
}) {
  return (
    <div className="h-full w-[336px] flex flex-col shrink-0 overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          boxShadow:
            "inset -1px 0 0 0 color-mix(in srgb, var(--color-border) 50%, transparent)",
        }}
      />
      <div className="px-6 py-5 flex items-center shrink-0">
        <span className="text-sm">
          <span className="font-semibold">My queue</span>
          <span className="text-muted-foreground font-normal">
            {" "}
            · {invoicesReview.length} invoices
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar [mask-image:linear-gradient(to_bottom,transparent_0,black_24px,black_calc(100%_-_80px),transparent_100%)]">
        <NavSectionLabel
          label="Due today"
          count={dueTodayInvoices.length}
          first
        />
        <div className="space-y-2 pb-4">
          {dueTodayInvoices.map((inv) => (
            <NavInvoiceItem
              key={inv.id}
              invoice={inv}
              isActive={inv.id === activeId}
              onClick={() => onInvoiceClick(inv.id)}
            />
          ))}
        </div>

        <NavSectionLabel
          label="Due tomorrow"
          count={
            invoicesReview.filter((inv) => inv.dueGroup === "tomorrow").length
          }
        />
        <div className="space-y-2 pb-4">
          {invoicesReview
            .filter((inv) => inv.dueGroup === "tomorrow")
            .map((inv) => (
              <NavInvoiceItem
                key={inv.id}
                invoice={inv}
                isActive={inv.id === activeId}
                onClick={() => onInvoiceClick(inv.id)}
              />
            ))}
        </div>

        <NavSectionLabel label="Auto-approved" />
        <div className="space-y-2 pb-4">
          {invoicesAuto.map((inv) => (
            <NavInvoiceItem
              key={inv.id}
              invoice={inv}
              isActive={inv.id === activeId}
              onClick={() => onInvoiceClick(inv.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({ emailSent }: { emailSent: boolean }) {
  const d = useInvoiceDetail();
  return (
    <PageHeader bordered className="@3xl:!grid-cols-[auto_1fr]">
      <PageHeaderNav>
        <PageHeaderTitleGroup>
          <PageHeaderTitle as="h2">{d.id}</PageHeaderTitle>
          <PageHeaderDescription>{d.vendor}</PageHeaderDescription>
        </PageHeaderTitleGroup>
      </PageHeaderNav>
      <PageHeaderContent>
        <PageHeaderField>
          <PageHeaderFieldLabel>Amount</PageHeaderFieldLabel>
          <PageHeaderFieldValue>{d.amount}</PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Due</PageHeaderFieldLabel>
          <PageHeaderFieldValue>{d.dueFormatted}</PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>PO</PageHeaderFieldLabel>
          <PageHeaderFieldValue>{d.po}</PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
          <PageHeaderFieldValue
            className={cn(
              "flex items-center gap-1 transition-colors duration-300",
              emailSent ? "text-primary" : "text-muted-foreground",
            )}
          >
            {emailSent ? (
              <Mail className="size-3.5 shrink-0" />
            ) : (
              <Clock className="size-3.5 shrink-0" />
            )}
            {emailSent ? "Supplier contacted" : "Awaiting decision"}
          </PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Assignee</PageHeaderFieldLabel>
          <PageHeaderFieldValue className="flex items-center gap-1.5">
            <span className="size-[14px] rounded-full flex items-center justify-center text-[7px] font-bold text-background bg-muted-foreground shrink-0">
              {d.assigneeInitials[0]}
            </span>
            {d.assignee}
          </PageHeaderFieldValue>
        </PageHeaderField>
      </PageHeaderContent>
    </PageHeader>
  );
}

// ── AISummaryBar + AISummaryExpanded ─────────────────────────────────────────

type ActivityBarProps = {
  expanded: boolean;
  onToggle: () => void;
  emailSent: boolean;
  minimal?: boolean;
};

// A — Status Badge pills + labelled expand
function ActivityBarA({ expanded, onToggle }: ActivityBarProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      className="flex-1 flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 hover:bg-muted/40 transition-colors text-left min-w-0 cursor-default"
    >
      <Badge variant="secondary" status="success">
        3 passed
      </Badge>
      <Badge variant="secondary" status="error">
        1 failed
      </Badge>
      <div className="w-px h-3 bg-border shrink-0" />
      <div className="flex items-center -space-x-0.5 shrink-0">
        <AvatarChip type="ai-pass" />
        <AvatarChip type="ai-fail" />
        <AvatarChip type="user" />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        Opened 4m ago
      </span>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{expanded ? "Hide" : "View"} activity</span>
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>
    </div>
  );
}

// B — Colored numbers + labeled expand pill
function ActivityBarB({ expanded, onToggle }: ActivityBarProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      className="flex-1 flex items-center gap-3 px-4 sm:px-6 lg:px-8 hover:bg-muted/40 transition-colors text-left min-w-0 cursor-default"
    >
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-sm font-semibold text-success">3</span>
        <span className="text-xs text-muted-foreground">passed</span>
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-sm font-semibold text-destructive">1</span>
        <span className="text-xs text-muted-foreground">failed</span>
      </div>
      <div className="w-px h-3 bg-border shrink-0" />
      <span className="text-xs text-muted-foreground truncate">
        AI review complete · 1 exception · opened 4m ago
      </span>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <div
          className={cn(
            "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border transition-colors",
            expanded
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Checks</span>
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>
    </div>
  );
}

// C — Inline named check steps with dots, responsive condensing
function ActivityBarC({
  expanded,
  onToggle,
  emailSent,
  minimal,
}: ActivityBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(9999);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setBarWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showFull = barWidth > 640;
  const showMeta = !minimal && barWidth > 480;

  const baseChecks = [
    { label: "Extracted", status: "pass" as const },
    { label: "Vendor", status: "pass" as const },
    { label: "Duplicate", status: "pass" as const },
    { label: "Price", status: "fail" as const },
    { label: "Lines", status: "skip" as const },
  ];
  const checks = emailSent
    ? [...baseChecks, { label: "Contacted", status: "actioned" as const }]
    : baseChecks;

  const passCount = baseChecks.filter((c) => c.status === "pass").length;
  const failCount = baseChecks.filter((c) => c.status === "fail").length;

  return (
    <div
      ref={barRef}
      {...(!minimal && {
        role: "button" as const,
        tabIndex: 0,
        onClick: onToggle,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        },
      })}
      className={cn(
        "flex-1 flex items-center gap-3 px-4 sm:px-6 lg:px-8 transition-colors text-left min-w-0 cursor-default",
        !minimal && "hover:bg-muted/40",
      )}
    >
      {showFull ? (
        <div className="flex items-center gap-2 shrink-0">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-1">
              <div
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  check.status === "pass" && "bg-success",
                  check.status === "fail" && "bg-destructive",
                  check.status === "actioned" && "bg-primary",
                  check.status === "skip" &&
                    "border border-muted-foreground/40",
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  check.status === "fail"
                    ? "text-[#E24B4A] font-medium"
                    : check.status === "actioned"
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                )}
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-success">
              {passCount}
            </span>
            <span className="text-xs text-muted-foreground">passed</span>
          </div>
          {failCount > 0 && (
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-destructive">
                {failCount}
              </span>
              <span className="text-xs text-muted-foreground">failed</span>
            </div>
          )}
        </div>
      )}

      {showMeta && (
        <div className="w-px h-3 bg-border dark:bg-[#333] shrink-0" />
      )}
      {showMeta && (
        <>
          <div className="flex items-center -space-x-0.5 shrink-0">
            <AvatarChip type="ai-pass" />
            <AvatarChip type="ai-fail" />
            <AvatarChip type="user" />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">4m ago</span>
        </>
      )}

      {!minimal && (
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <span>{expanded ? "Hide" : "View"} activity</span>
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        </div>
      )}
    </div>
  );
}

function AISummaryBar(props: ActivityBarProps) {
  return <ActivityBarC {...props} />;
}

const activityChecks = [
  {
    status: "pass" as const,
    label: "Data extracted",
    desc: "All fields parsed successfully.",
  },
  {
    status: "pass" as const,
    label: "Vendor matched",
    desc: "ACME Industrial confirmed.",
  },
  {
    status: "pass" as const,
    label: "No duplicate",
    desc: "Clean in last 90 days.",
  },
  {
    status: "fail" as const,
    label: "Price mismatch",
    desc: "$694.39 vs PO $689.55 (+$4.84, 0.7% over 0.5% tolerance). Could not auto-resolve.",
  },
  {
    status: "skip" as const,
    label: "Line items",
    desc: "Skipped — halted at price check.",
  },
];

const activityLog = [
  {
    chip: "ai-pass" as const,
    text: "Agent reviewed & escalated",
    time: "Oct 5 · 9:42am",
  },
  {
    chip: "user" as const,
    text: "Assigned & opened",
    time: "9:50am · 10:04am",
  },
];

function ActivityLogRows() {
  return (
    <>
      {activityLog.map((row) => (
        <div key={row.text} className="flex items-center gap-2 text-xs">
          <AvatarChip type={row.chip} />
          <span className="text-muted-foreground">{row.text}</span>
          <span className="text-muted-foreground ml-auto shrink-0">
            {row.time}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-xs">
        <div className="size-[14px] rounded-full border-2 border-dashed border-muted-foreground/40 shrink-0" />
        <span className="text-muted-foreground italic">Awaiting decision</span>
      </div>
    </>
  );
}

// Expanded A — Badge pills per check, activity footer
function ExpandedA() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="p-4 space-y-2.5">
        {activityChecks.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            <Badge
              variant="secondary"
              {...(item.status === "pass"
                ? { status: "success" as const }
                : item.status === "fail"
                  ? { status: "error" as const }
                  : {})}
              className="mt-0.5 shrink-0"
            >
              {item.status === "pass"
                ? "Pass"
                : item.status === "fail"
                  ? "Fail"
                  : "Skip"}
            </Badge>
            <div className="text-sm leading-relaxed">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground"> — {item.desc}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/20">
        <ActivityLogRows />
      </div>
    </div>
  );
}

// Expanded B — Progress strip + table rows
function ExpandedB() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-3 bg-muted/20">
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-success rounded-full"
            style={{ width: "60%" }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          3 of 5 checks passed
        </span>
      </div>
      <div className="divide-y divide-border">
        {activityChecks.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-2">
            <span
              className={cn(
                "text-[10px] font-semibold w-7 shrink-0",
                item.status === "pass" && "text-success",
                item.status === "fail" && "text-destructive",
                item.status === "skip" && "text-muted-foreground",
              )}
            >
              {item.status === "pass"
                ? "OK"
                : item.status === "fail"
                  ? "ERR"
                  : "—"}
            </span>
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs text-muted-foreground ml-auto text-right max-w-[55%] leading-snug">
              {item.desc}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/20">
        <ActivityLogRows />
      </div>
    </div>
  );
}

// Expanded C — Vertical timeline matching the inline dot steps
function ExpandedC({ sentEmails }: { sentEmails: SentEmail[] }) {
  return (
    <div className="space-y-0">
      {activityChecks.map((item, i) => (
        <div key={item.label} className="flex gap-3">
          <div className="flex flex-col items-center w-5 shrink-0">
            <div
              className={cn(
                "size-2 rounded-full mt-[6px] shrink-0",
                item.status === "pass" && "bg-success",
                item.status === "fail" && "bg-destructive",
                item.status === "skip" && "bg-border",
              )}
            />
            {i < activityChecks.length - 1 && (
              <div className="w-px flex-1 min-h-[10px] bg-border my-1" />
            )}
          </div>
          <div className="pb-3">
            <span
              className={cn(
                "text-sm font-medium",
                item.status === "fail" ? "text-destructive" : "text-foreground",
              )}
            >
              {item.label}
            </span>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              {item.desc}
            </p>
          </div>
        </div>
      ))}
      <div className="border-t border-border pt-3 space-y-2">
        {activityLog.map((row) => (
          <div key={row.text} className="flex gap-3 items-center text-xs">
            <div className="w-5 shrink-0 flex items-center justify-center">
              <AvatarChip type={row.chip} />
            </div>
            <span className="text-muted-foreground">{row.text}</span>
            <span className="text-muted-foreground ml-auto shrink-0">
              {row.time}
            </span>
          </div>
        ))}
        {sentEmails.map((email) => (
          <div key={email.sentAt} className="flex gap-3 items-start text-xs">
            <div className="w-5 shrink-0 flex items-center justify-center mt-0.5">
              <Mail className="size-3 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-foreground font-medium">Email sent</span>
              <p className="text-muted-foreground truncate">To: {email.to}</p>
            </div>
            <span className="text-muted-foreground ml-auto shrink-0">
              {email.sentAt}
            </span>
          </div>
        ))}
        {sentEmails.length === 0 && (
          <div className="flex gap-3 items-center text-xs">
            <div className="w-5 shrink-0 flex items-center justify-center">
              <div className="size-[14px] rounded-full border-2 border-dashed border-muted-foreground/40 shrink-0" />
            </div>
            <span className="text-muted-foreground italic">
              Awaiting decision
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AISummaryExpanded({ sentEmails }: { sentEmails: SentEmail[] }) {
  return <ExpandedC sentEmails={sentEmails} />;
}

// ── Center content ────────────────────────────────────────────────────────────

function MetricsRow({ className }: { className?: string }) {
  const { exceptionMetrics } = useInvoiceDetail();
  return (
    <div className={cn("flex", className)}>
      {exceptionMetrics.map((col, i) => (
        <div
          key={col.label}
          className={cn(
            "flex flex-col gap-0.5 flex-1",
            i > 0 && "border-l border-border pl-4 ml-4",
          )}
        >
          <span className="text-xs text-muted-foreground">{col.label}</span>
          <span className={cn("text-2xl font-semibold leading-tight", col.cls)}>
            {col.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function generateDraftBody(data: InvoiceDetailData): string {
  const lineDesc = data.lines[0]?.description ?? "the invoiced item";
  const invoiced = data.lines[0]?.amount ?? data.amount;
  const agreed = data.lines[0]?.agreed;
  const agreedLine = agreed
    ? `However, per Purchase Order ${data.po}, the agreed price is ${agreed}.\n\nIt appears the negotiated discount was not applied to this invoice. We kindly ask you to provide a corrected invoice reflecting the agreed price of ${agreed}.`
    : data.exceptionBody;
  return `Dear Accounts team,\n\nWe are writing regarding Invoice ${data.id}. Upon review, we noticed that the line item "${lineDesc}" is listed at ${invoiced}. ${agreedLine}\n\nThank you for your prompt attention to this matter.\n\nKind regards,\n[Your name]`;
}

const AI_REWRITES = [
  "Make formal",
  "Make concise",
  "Add detail",
  "Simplify",
] as const;

function EmailComposer({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (email: SentEmail) => void;
}) {
  const data = useInvoiceDetail();
  const [to, setTo] = useState(data.vendorEmail);
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(
    `Invoice correction request — Invoice ${data.id}`,
  );
  const [body, setBody] = useState(() => generateDraftBody(data));
  const [sending, setSending] = useState(false);

  return (
    <div className="flex flex-col h-full inv-between-enter">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="size-4" />
            <h2 className="text-base font-semibold">Draft Email</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Review and edit the email below before sending to {data.vendor}.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* To / CC / Subject fields */}
      <div className="px-6 py-3 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">
            To:
          </span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 bg-muted/30 rounded-md px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
          />
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-xs text-primary hover:underline shrink-0"
            >
              + CC
            </button>
          )}
        </div>
        {showCc && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-14 shrink-0">
              CC:
            </span>
            <input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Add CC recipients…"
              className="flex-1 bg-muted/30 rounded-md px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40 min-w-0"
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">
            Subject:
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-muted/30 rounded-md px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
          />
        </div>
      </div>

      {/* AI rewrite toolbar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border shrink-0 bg-muted/20">
        <Sparkle className="size-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground shrink-0 mr-1">
          AI rewrite:
        </span>
        {AI_REWRITES.map((action) => (
          <button
            key={action}
            type="button"
            className="text-xs px-2.5 py-0.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full h-full resize-none bg-muted/20 rounded-lg border border-border p-4 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring custom-scrollbar"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="default"
          disabled={sending}
          onClick={() => {
            setSending(true);
            setTimeout(() => {
              onSend({ to, cc, subject, body, sentAt: "just now" });
            }, 800);
          }}
        >
          <Mail className="size-3.5" />
          {sending ? "Sending…" : "Send Email"}
        </Button>
      </div>
    </div>
  );
}

function ActionBlock({
  onPrimaryAction,
  variant,
}: {
  onPrimaryAction: () => void;
  variant: Variant;
}) {
  const { exceptionPrimaryAction, exceptionSecondaryAction } =
    useInvoiceDetail();
  const isApproveAction = exceptionSecondaryAction === "Approve";
  const [drafting, setDrafting] = useState(false);

  const isApprovalType =
    exceptionPrimaryAction.toLowerCase().includes("approval") ||
    exceptionPrimaryAction.toLowerCase().includes("sign-off");

  function handlePrimary() {
    setDrafting(true);
    setTimeout(
      () => {
        setDrafting(false);
        onPrimaryAction();
      },
      isApprovalType ? 1800 : 1000,
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        disabled={drafting}
        onClick={handlePrimary}
        className={cn(
          variant === "C" &&
            "bg-primary dark:text-gray-900 hover:bg-primary/90 border-0",
        )}
      >
        {drafting ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Drafting…
          </>
        ) : (
          exceptionPrimaryAction
        )}
      </Button>
      <Button
        variant={isApproveAction ? "ghost" : "secondary"}
        className={cn(
          isApproveAction
            ? "bg-transparent border-0 shadow-none text-[13px] text-[#666] hover:bg-transparent hover:text-[#999]"
            : "dark:bg-transparent dark:[border-width:1.5px] dark:border-[#555] dark:text-[#CCC] dark:hover:bg-white/5",
        )}
      >
        {exceptionSecondaryAction}
      </Button>
    </div>
  );
}

const AGENT_SUGGESTIONS = [
  "Previous issues with ACME?",
  "View PO note",
  "Tolerance policy",
];

function AgentInputBar() {
  const [agentQuery, setAgentQuery] = useState("");
  const [agentFocused, setAgentFocused] = useState(false);

  return (
    <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-[6px] pb-5">
      <div
        className="flex items-center gap-2 rounded-[10px] transition-shadow"
        style={{
          border: agentFocused
            ? "2px solid transparent"
            : "2px solid var(--input)",
          background: agentFocused
            ? "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(97.73deg, #6C5AEF 8.79%, #69C7DD 91.48%) border-box"
            : undefined,
          boxShadow: agentFocused
            ? "0 0 0 3px color-mix(in oklch, var(--muted-foreground) 10%, transparent)"
            : undefined,
          padding: "8px 8px 8px 14px",
        }}
      >
        <input
          type="text"
          value={agentQuery}
          onChange={(e) => setAgentQuery(e.target.value)}
          onFocus={() => setAgentFocused(true)}
          onBlur={() => setAgentFocused(false)}
          placeholder="Ask a question about this invoice…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
        />
        <button
          type="button"
          disabled={!agentQuery.trim()}
          onClick={() => setAgentQuery("")}
          className="shrink-0 size-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: agentFocused ? "#1a1a1a" : "#F0F0F0" }}
        >
          <ArrowUp
            className={cn(
              "size-[18px] transition-colors",
              agentFocused ? "text-white" : "text-[#555]",
            )}
          />
        </button>
      </div>
    </div>
  );
}

function ExceptionBlock({
  onContactSupplier,
  variant,
}: {
  onContactSupplier: () => void;
  variant: Variant;
}) {
  const {
    exceptionTag,
    exceptionTagStatus,
    exceptionHeadline,
    exceptionBody,
    exceptionMetrics,
  } = useInvoiceDetail();
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Badge variant="secondary" status={exceptionTagStatus}>
          {exceptionTag}
        </Badge>
      </div>
      <h2
        className="font-bold leading-[1.2] tracking-tight text-foreground w-full mb-5 overflow-hidden line-clamp-2"
        style={{
          fontSize: exceptionHeadline.length > 50 ? "28px" : "32px",
          textWrap: "balance",
          maxWidth: "22ch",
        }}
      >
        {exceptionHeadline}
      </h2>
      {variant === "C" ? (
        <div className="grid grid-cols-3 divide-x divide-border rounded-[6px] max-w-[480px] mb-5 [&>div:first-child]:pl-0">
          {exceptionMetrics.map((m) => (
            <div key={m.label} className="px-6 py-[18px] flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
                {m.label}
              </span>
              <span
                className={cn(
                  "text-[30px] font-semibold tracking-tight leading-none whitespace-nowrap",
                  m.cls,
                )}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed mb-1 max-w-[480px]">
            {exceptionMetrics.map((m, i) => (
              <span key={m.label}>
                {i > 0 && (
                  <span className="text-muted-foreground"> &nbsp;·&nbsp; </span>
                )}
                <span className="text-muted-foreground">{m.label} </span>
                <span className={cn("font-semibold", m.cls)}>{m.value}</span>
              </span>
            ))}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[480px] mt-4 mb-8">
            {exceptionBody}
          </p>
        </>
      )}
      {variant === "C" && (
        <p className="text-[14px] text-muted-foreground leading-[1.7] max-w-[540px] mb-7">
          {exceptionBody}
        </p>
      )}
      <ActionBlock onPrimaryAction={onContactSupplier} variant={variant} />
    </div>
  );
}

function dueDateUrgency(dueDate: string): {
  daysUntil: number;
  label: string;
  suggestion: string | null;
  level: "overdue" | "urgent" | "warning" | "ok";
} {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const d = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (d < 0)
    return {
      daysUntil: d,
      label: `Overdue by ${Math.abs(d)} day${Math.abs(d) !== 1 ? "s" : ""}`,
      suggestion: "Escalate or reject — payment is overdue.",
      level: "overdue",
    };
  if (d === 0)
    return {
      daysUntil: d,
      label: "Due today",
      suggestion: "Send a follow-up now or consider rejecting.",
      level: "urgent",
    };
  if (d === 1)
    return {
      daysUntil: d,
      label: "Due tomorrow",
      suggestion: "Follow up today if no response.",
      level: "urgent",
    };
  if (d <= 5)
    return {
      daysUntil: d,
      label: `Due in ${d} days`,
      suggestion: "Follow up soon to leave time for a corrected invoice.",
      level: "warning",
    };
  return {
    daysUntil: d,
    label: `Due in ${d} days`,
    suggestion: null,
    level: "ok",
  };
}

function AwaitingResponseBlock({
  sentEmails,
  onFollowUp,
}: {
  sentEmails: SentEmail[];
  onFollowUp: () => void;
}) {
  const { assignee, dueDate } = useInvoiceDetail();

  const urgency = dueDateUrgency(dueDate);

  const urgencyStatus = {
    overdue: "error",
    urgent: "warning",
    warning: "warning",
    ok: "default",
  } as const;

  const timeline = [
    { label: "Exception flagged", time: "on receipt", done: true },
    { label: `Assigned to ${assignee}`, time: "on receipt", done: true },
    ...sentEmails.map((e, i) => ({
      label:
        i === 0 ? `Supplier contacted — ${e.to}` : `Follow-up sent — ${e.to}`,
      time: e.sentAt,
      done: true,
    })),
    { label: "Awaiting supplier response", time: null, done: false },
  ];

  return (
    <div className="inv-between-enter space-y-7">
      {/* Due date urgency */}
      <Alert status={urgencyStatus[urgency.level]} visual="outline">
        <Clock />
        <AlertTitle>
          {urgency.label}
          {urgency.suggestion && (
            <span className="font-normal text-muted-foreground">
              {" — "}
              {urgency.suggestion}
            </span>
          )}
        </AlertTitle>
      </Alert>

      {/* Micro-timeline */}
      <div className="space-y-2.5">
        {timeline.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              {step.done ? (
                <div className="size-4 rounded-full bg-primary/15 flex items-center justify-center">
                  <Check className="size-2.5 text-primary" />
                </div>
              ) : (
                <div className="size-4 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              )}
              {i < timeline.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1 mb-[-2px] min-h-[14px]" />
              )}
            </div>
            <div className="pb-3 min-w-0">
              <span
                className={cn(
                  "text-sm leading-none",
                  step.done ? "text-foreground" : "text-primary font-medium",
                )}
              >
                {step.label}
              </span>
              {step.time && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {step.time}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="default">Mark resolved</Button>
        <Button variant="secondary" onClick={onFollowUp}>
          Send follow-up
        </Button>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          Reject invoice
        </Button>
      </div>
    </div>
  );
}

// ── Right Panel Tabs ──────────────────────────────────────────────────────────

function InlineRow({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <p className="text-xs text-muted-foreground shrink-0 pt-px leading-[1.6]">
        {label}
      </p>
      <div className="text-right">
        <p
          className={cn(
            "text-xs font-medium text-foreground leading-[1.6]",
            valueClassName,
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/20 overflow-hidden">
      <p className="text-[11px] font-semibold text-foreground dark:text-white/70 px-3 pt-3 pb-2">
        {title}
      </p>
      <div className="px-3 pb-1">{children}</div>
    </div>
  );
}

function DetailsTab() {
  const d = useInvoiceDetail();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="pl-5 pr-8 pt-5 pb-8 space-y-5">
        <SectionCard title="Invoice">
          <InlineRow label="Document date" value={d.documentDateFormatted} />
          <InlineRow label="Due date" value={d.dueFormatted} />
          <InlineRow label="Payment terms" value={d.paymentTerms} />
        </SectionCard>
        <SectionCard title="Parties">
          <InlineRow label="Vendor" value={d.vendor} sub={d.vendorEmail} />
          <InlineRow label="Purchase order" value={d.po} />
          <InlineRow label="Bill to" value={d.billTo} sub={d.billAddress} />
        </SectionCard>
        <SectionCard title="Reference">
          <InlineRow label="Currency" value={d.currency} />
          <InlineRow label="Assignee" value={d.assignee} />
          {d.vat !== "—" && <InlineRow label="VAT number" value={d.vat} />}
        </SectionCard>
      </div>
    </div>
  );
}

function LinesTab() {
  const { lines, linesTotal, linesAlert } = useInvoiceDetail();
  return (
    <div className="pl-4 pr-8 pt-5 pb-8 space-y-3">
      {lines.map((line) => (
        <SectionCard key={line.description} title={line.description}>
          <InlineRow label="Qty" value={String(line.qty)} />
          <InlineRow
            label="Amount"
            value={line.amount}
            valueClassName={cn(
              line.flagStatus === "error" && "text-destructive",
              line.flagStatus === "warning" && "text-warning",
            )}
          />
          {line.agreed && <InlineRow label="PO agreed" value={line.agreed} />}
          {line.flag && (
            <div className="pb-2.5">
              <Badge
                variant="secondary"
                status={line.flagStatus}
                className="text-xs"
              >
                {line.flag}
              </Badge>
            </div>
          )}
        </SectionCard>
      ))}

      <div className="flex justify-between px-1 pt-1 text-sm font-semibold">
        <span>Total</span>
        <span>{linesTotal}</span>
      </div>

      {linesAlert && (
        <Alert status={linesAlert.status} visual="outline">
          <AlertTitle>{linesAlert.text}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}

function SourceTab() {
  const {
    sourceFilename,
    vendor,
    vendorEmail,
    dueFormatted,
    documentDateFormatted,
    po,
    paymentTerms,
    billTo,
    billAddress,
    lines,
    linesTotal,
    vat,
  } = useInvoiceDetail();
  return (
    <div className="flex flex-col h-full bg-[#525659]">
      {/* PDF viewer toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#3c3c3c] border-b border-[#2a2a2a] shrink-0">
        <span className="text-xs text-[#d4d4d4] font-medium truncate max-w-[180px]">
          {sourceFilename}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#a0a0a0]">1 / 1</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="text-xs text-[#a0a0a0] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#555]"
            >
              −
            </button>
            <span className="text-xs text-[#a0a0a0] w-9 text-center">100%</span>
            <button
              type="button"
              className="text-xs text-[#a0a0a0] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#555]"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="text-xs text-[#a0a0a0] hover:text-white"
          >
            ↗
          </button>
        </div>
      </div>

      {/* Page area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-5 px-4 flex justify-center">
        {/* White page */}
        <div className="bg-white w-full shadow-xl text-gray-900 text-[10px] leading-relaxed p-8 space-y-4 self-start">
          {/* Header */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="text-base font-bold tracking-tight">INVOICE</div>
              <div className="text-[9px] text-gray-400 mt-0.5">
                {sourceFilename}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-[11px]">{vendor}</div>
              <div className="text-gray-500 text-[9px]">{vendorEmail}</div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: "Invoice Date", value: documentDateFormatted },
              { label: "Due Date", value: dueFormatted },
              { label: "PO Number", value: po },
              { label: "Payment Terms", value: paymentTerms },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[8px] text-gray-400 mb-0.5">{label}</div>
                <div className="font-medium text-[10px]">{value}</div>
              </div>
            ))}
          </div>

          {/* Bill to */}
          <div>
            <div className="text-[8px] text-gray-400 mb-0.5">Bill to</div>
            <div className="font-medium">{billTo}</div>
            <div className="text-gray-500 text-[9px]">{billAddress}</div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Line items */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-[8px] text-gray-400 pb-1.5 font-normal">
                  Description
                </th>
                <th className="text-center text-[8px] text-gray-400 pb-1.5 font-normal w-8">
                  Qty
                </th>
                <th className="text-right text-[8px] text-gray-400 pb-1.5 font-normal">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-800">{line.description}</td>
                  <td className="py-1.5 text-center text-gray-500">
                    {line.qty}
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {line.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 ml-auto w-40">
            {vat !== "—" && (
              <div className="flex justify-between">
                <span className="text-gray-500">VAT</span>
                <span>{vat}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[11px] border-t border-gray-300 pt-1.5">
              <span>Total</span>
              <span>{linesTotal}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 text-[9px] text-gray-400 text-center">
            Thank you for your business.
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailViewer({
  email,
  onClose,
}: {
  email: SentEmail;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full inv-between-enter">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="size-4" />
            <h2 className="text-base font-semibold">{email.subject}</h2>
          </div>
          <p className="text-xs text-muted-foreground">Sent {email.sentAt}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* To / CC */}
      <div className="px-6 py-3 border-b border-border shrink-0 space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">
            To:
          </span>
          <span className="text-sm">{email.to}</span>
        </div>
        {email.cc && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-14 shrink-0">
              CC:
            </span>
            <span className="text-sm">{email.cc}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {email.body}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-6 py-4 border-t border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-success shrink-0" />
          <span className="text-xs text-muted-foreground">Sent</span>
        </div>
      </div>
    </div>
  );
}

function CommsTab({
  sentEmails,
  onEmailClick,
}: {
  sentEmails: SentEmail[];
  onEmailClick: (email: SentEmail) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
      {sentEmails.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center pt-8">
          No messages sent yet.
        </p>
      ) : (
        sentEmails.map((email) => (
          <button
            key={email.sentAt}
            type="button"
            onClick={() => onEmailClick(email)}
            className="w-full text-left border border-border rounded-lg p-3 space-y-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="size-3 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">
                  {email.subject}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {email.sentAt}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>To: {email.to}</p>
              {email.cc && <p>CC: {email.cc}</p>}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 border-t border-border/50 pt-2">
              {email.body}
            </p>
            <div className="flex items-center gap-1 pt-0.5">
              <div className="size-1.5 rounded-full bg-success shrink-0" />
              <span className="text-[10px] text-muted-foreground">Sent</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function ActivityTab({ sentEmails }: { sentEmails: SentEmail[] }) {
  type Entry =
    | {
        kind: "check";
        label: string;
        desc: string;
        status: "pass" | "fail" | "skip";
      }
    | {
        kind: "log";
        text: string;
        time: string;
        chip: "ai-pass" | "ai-fail" | "user";
      }
    | { kind: "email"; email: SentEmail }
    | { kind: "pending" };

  const entries: Entry[] = [
    ...activityChecks.map((c) => ({ kind: "check" as const, ...c })),
    ...activityLog.map((r) => ({ kind: "log" as const, ...r })),
    ...sentEmails.map((e) => ({ kind: "email" as const, email: e })),
    ...(sentEmails.length === 0 ? [{ kind: "pending" as const }] : []),
  ].reverse();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pl-4 pr-8 py-4">
      <div className="space-y-0">
        {entries.map((entry, i) => {
          const isLast = i === entries.length - 1;
          const isPending = entry.kind === "pending";

          const dot =
            entry.kind === "check" ? (
              <div
                className={cn(
                  "size-2 rounded-full mt-[5px] shrink-0",
                  entry.status === "pass" && "bg-success",
                  entry.status === "fail" && "bg-destructive",
                  entry.status === "skip" && "bg-border",
                )}
              />
            ) : entry.kind === "log" ? (
              <div className="mt-[2px] shrink-0">
                <AvatarChip type={entry.chip} />
              </div>
            ) : entry.kind === "email" ? (
              <Mail className="size-3 text-primary mt-[5px] shrink-0" />
            ) : (
              <div className="size-[10px] rounded-full border border-dashed border-muted-foreground/40 mt-[5px] shrink-0" />
            );

          const content =
            entry.kind === "check" ? (
              <div className="pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "text-[13px] font-semibold leading-snug",
                      entry.status === "fail"
                        ? "text-destructive"
                        : "text-foreground",
                    )}
                  >
                    {entry.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  {entry.desc}
                </p>
              </div>
            ) : entry.kind === "log" ? (
              <div className="pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold text-foreground leading-snug">
                    {entry.text}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {entry.time}
                  </span>
                </div>
              </div>
            ) : entry.kind === "email" ? (
              <div className="pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold text-foreground leading-snug">
                    Email sent
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  To: {entry.email.to}
                </p>
              </div>
            ) : (
              <div className="pb-3">
                <span className="text-[13px] text-muted-foreground leading-snug">
                  Awaiting decision
                </span>
              </div>
            );

          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center w-5 shrink-0">
                {dot}
                {!isLast && (
                  <div className="w-px flex-1 min-h-[8px] bg-border/60 my-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">{content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailsCombinedTab() {
  const d = useInvoiceDetail();
  const labelCls =
    "text-[10px] tracking-wide text-muted-foreground font-medium leading-none mb-0.5";
  const valueCls = "text-[13px] text-foreground leading-[1.6]";
  const rowCls = "flex flex-col py-2.5 border-b border-border last:border-0";

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="pl-5 pr-8 pt-5 pb-8 space-y-6">
        {/* Section A — metadata */}
        <div>
          <p className="text-[10px] tracking-wide text-muted-foreground font-semibold mb-3">
            Invoice
          </p>
          <div className="divide-y divide-border">
            <div className={rowCls}>
              <span className={labelCls}>Document date</span>
              <span className={valueCls}>{d.documentDateFormatted}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Due date</span>
              <span className={valueCls}>{d.dueFormatted}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Payment terms</span>
              <span className={valueCls}>{d.paymentTerms}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] tracking-wide text-muted-foreground font-semibold mb-3">
            Parties
          </p>
          <div className="divide-y divide-border">
            <div className={rowCls}>
              <span className={labelCls}>Vendor</span>
              <span className={valueCls}>{d.vendor}</span>
              {d.vendorEmail && (
                <span className="text-[12px] text-muted-foreground">
                  {d.vendorEmail}
                </span>
              )}
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Purchase order</span>
              <span className={valueCls}>{d.po}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Bill to</span>
              <span className={valueCls}>{d.billTo}</span>
              {d.billAddress && (
                <span className="text-[12px] text-muted-foreground">
                  {d.billAddress}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] tracking-wide text-muted-foreground font-semibold mb-3">
            Reference
          </p>
          <div className="divide-y divide-border">
            <div className={rowCls}>
              <span className={labelCls}>Currency</span>
              <span className={valueCls}>{d.currency}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Assignee</span>
              <span className={valueCls}>{d.assignee}</span>
            </div>
            {d.vat !== "—" && (
              <div className={rowCls}>
                <span className={labelCls}>VAT number</span>
                <span className={valueCls}>{d.vat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section B — line items */}
        <div>
          <p className="text-[10px] tracking-wide text-muted-foreground font-semibold mb-3">
            Line items
          </p>
          <div className="divide-y divide-border">
            {d.lines.map((line) => (
              <div key={line.description} className="py-2.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[13px] text-foreground leading-snug flex-1">
                    {line.description}
                  </span>
                  {line.flag && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full border border-destructive/60 text-destructive shrink-0 leading-none">
                      {line.flag}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                  <span>Qty {line.qty}</span>
                  <span
                    className={cn(
                      line.flagStatus === "error" && "text-destructive",
                      line.flagStatus === "warning" && "text-warning",
                    )}
                  >
                    {line.amount}
                  </span>
                  {line.agreed && <span>PO {line.agreed}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 text-[13px] font-semibold text-foreground">
            <span>Total</span>
            <span>{d.linesTotal}</span>
          </div>
          {d.linesAlert && (
            <p className="mt-2 text-[12px] text-destructive/80 leading-snug">
              {d.linesAlert.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityTabC() {
  type TimelineItem = {
    label: string;
    time?: string;
    desc?: string;
    indicator: "pending" | "user" | "ai-warn" | "ai-pass";
  };

  const items: TimelineItem[] = [
    { label: "Awaiting decision", indicator: "pending" },
    {
      label: "Assigned & opened",
      time: "9:14 AM",
      desc: "AJ",
      indicator: "user",
    },
    {
      label: "Agent escalated",
      time: "9:12 AM",
      desc: "Price exceeds PO — manual review required",
      indicator: "ai-warn",
    },
    {
      label: "Agent reviewed",
      time: "9:10 AM",
      desc: "PO matched · Terms verified",
      indicator: "ai-pass",
    },
    {
      label: "Data extracted",
      time: "9:08 AM",
      desc: "Invoice parsed successfully",
      indicator: "ai-pass",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="pl-5 pr-8 pt-5 pb-5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          const dot =
            item.indicator === "pending" ? (
              <div className="size-4 rounded-full border border-dashed border-muted-foreground/40 shrink-0" />
            ) : item.indicator === "user" ? (
              <div className="size-4 rounded-full bg-muted-foreground shrink-0 flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-background" />
              </div>
            ) : item.indicator === "ai-warn" ? (
              <div className="size-4 rounded-full bg-amber-500/20 border border-amber-500/40 shrink-0 flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-amber-500" />
              </div>
            ) : (
              <div className="size-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 shrink-0 flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-emerald-500" />
              </div>
            );

          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center w-4 shrink-0">
                {dot}
                {!isLast && (
                  <div className="w-px flex-1 min-h-[10px] bg-border my-1" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-[32px]">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-[13px] leading-snug font-medium",
                      item.indicator === "pending"
                        ? "text-muted-foreground italic"
                        : "text-foreground",
                    )}
                  >
                    {item.label}
                  </p>
                  {item.time && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {item.time}
                    </span>
                  )}
                </div>
                {item.desc && (
                  <p className="text-[12px] text-muted-foreground leading-[1.5] mt-1">
                    {item.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AskFooter() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className="shrink-0" style={{ padding: "14px 20px" }}>
      <div className="flex gap-1.5 flex-wrap">
        {AGENT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="text-[11px] text-muted-foreground bg-transparent border border-border rounded-full hover:bg-accent hover:text-accent-foreground transition-colors leading-none cursor-pointer"
            style={{ padding: "4px 11px" }}
          >
            {s}
          </button>
        ))}
      </div>
      <div
        className="flex items-center gap-2 rounded-[10px] transition-shadow"
        style={{
          marginTop: "16px",
          border: focused ? "2px solid transparent" : "2px solid var(--input)",
          background: focused
            ? "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(97.73deg, #6C5AEF 8.79%, #69C7DD 91.48%) border-box"
            : undefined,
          boxShadow: focused
            ? "0 0 0 3px color-mix(in oklch, var(--muted-foreground) 10%, transparent)"
            : undefined,
          padding: "7px 7px 7px 13px",
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask about this invoice…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
        />
        <button
          type="button"
          disabled={!query.trim()}
          onClick={() => setQuery("")}
          className="flex-shrink-0 size-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "var(--ai-gradient-strong)" }}
        >
          <ArrowUp className="size-5" />
        </button>
      </div>
    </div>
  );
}

function RightPanel({
  tab,
  onTabChange,
  sentEmails,
  commsIsNew,
  onCommsViewed,
  onEmailClick,
  variant,
}: {
  tab: RightTab;
  onTabChange: (tab: RightTab) => void;
  sentEmails: SentEmail[];
  commsIsNew: boolean;
  onCommsViewed: () => void;
  onEmailClick: (email: SentEmail) => void;
  variant: Variant;
}) {
  const showComms = sentEmails.length > 0;
  const tabOrder: RightTab[] =
    variant === "C"
      ? [
          "activity",
          ...(showComms ? (["comms"] as const) : []),
          "details",
          "source",
        ]
      : [
          ...(variant === "B" ? (["activity"] as const) : []),
          ...(showComms ? (["comms"] as const) : []),
          "details",
          "lines",
          "source",
        ];

  return (
    <div
      className="border-l border-border flex flex-col shrink-0 overflow-hidden h-full"
      style={{
        width: tab === "source" ? "560px" : "384px",
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="flex shrink-0 border-b border-border">
        {tabOrder.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              onTabChange(t);
              if (t === "comms") onCommsViewed();
            }}
            className={cn(
              "relative flex-1 py-3 text-xs font-medium transition-colors capitalize",
              tab === t
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "comms" && commsIsNew && (
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "activity" &&
          (variant === "C" ? (
            <ActivityTabC />
          ) : (
            <ActivityTab sentEmails={sentEmails} />
          ))}
        {tab === "details" &&
          (variant === "C" ? <DetailsCombinedTab /> : <DetailsTab />)}
        {tab === "lines" && variant !== "C" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <LinesTab />
          </div>
        )}
        {tab === "source" && <SourceTab />}
        {tab === "comms" && (
          <CommsTab sentEmails={sentEmails} onEmailClick={onEmailClick} />
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

/** Center + right panel content only — no LeftNav wrapper. */
function InvoiceDetailPane({
  activeInvoiceId,
  variant,
}: {
  activeInvoiceId: string;
  variant: Variant;
}) {
  const data =
    detailDataMap[activeInvoiceId] ??
    (detailDataMap["INV-GRN-001"] as InvoiceDetailData);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>(
    variant === "B" || variant === "C" ? "activity" : "details",
  );

  useEffect(() => {
    setRightTab(variant === "B" || variant === "C" ? "activity" : "details");
  }, [variant]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [commsIsNew, setCommsIsNew] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<SentEmail | null>(null);

  function handleSend(email: SentEmail) {
    setSentEmails((prev) => [...prev, email]);
    setCommsIsNew(true);
    setEmailOpen(false);
    setRightTab("comms");
    toast.success("Email sent", { description: `To ${email.to}` });
  }

  function handleEmailClick(email: SentEmail) {
    setViewingEmail(email);
    setRightTab("comms");
  }

  return (
    <InvoiceDetailContext.Provider value={data}>
      <>
        <div
          className="shrink-0 inv-between-enter"
          style={{ animationDelay: "60ms" }}
        >
          <TopBar emailSent={sentEmails.length > 0} />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div
            className="flex flex-col flex-1 overflow-hidden inv-between-enter"
            style={{ animationDelay: "130ms" }}
          >
            {(variant === "A" || variant === "C") && (
              <div
                className={cn(
                  "shrink-0 transition-colors duration-200 border-b border-border",
                  summaryExpanded && "bg-card",
                )}
              >
                <div className="flex h-10">
                  <AISummaryBar
                    expanded={summaryExpanded}
                    onToggle={() => setSummaryExpanded((v) => !v)}
                    emailSent={sentEmails.length > 0}
                    minimal={variant === "C"}
                  />
                </div>
                {variant !== "C" && (
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      summaryExpanded
                        ? "max-h-[600px] opacity-100"
                        : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="px-4 sm:px-6 lg:px-8 py-5">
                      <AISummaryExpanded sentEmails={sentEmails} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col flex-1 overflow-hidden">
              {emailOpen ? (
                <EmailComposer
                  onClose={() => setEmailOpen(false)}
                  onSend={handleSend}
                />
              ) : viewingEmail ? (
                <EmailViewer
                  email={viewingEmail}
                  onClose={() => setViewingEmail(null)}
                />
              ) : sentEmails.length > 0 ? (
                <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 pt-7 pb-6 custom-scrollbar">
                  <AwaitingResponseBlock
                    sentEmails={sentEmails}
                    onFollowUp={() => setEmailOpen(true)}
                  />
                </div>
              ) : (
                <div
                  className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 custom-scrollbar"
                  style={{ paddingBottom: variant === "C" ? "136px" : "20px" }}
                >
                  <ExceptionBlock
                    onContactSupplier={() => setEmailOpen(true)}
                    variant={variant}
                  />
                </div>
              )}
              {variant === "C" && <AskFooter />}
            </div>
          </div>
          <div
            className="inv-between-enter h-full"
            style={{ animationDelay: "200ms" }}
          >
            <RightPanel
              tab={rightTab}
              onTabChange={setRightTab}
              sentEmails={sentEmails}
              commsIsNew={commsIsNew}
              onCommsViewed={() => setCommsIsNew(false)}
              onEmailClick={handleEmailClick}
              variant={variant}
            />
          </div>
        </div>
      </>
    </InvoiceDetailContext.Provider>
  );
}

type TransitionPhase = "list" | "collapsing" | "detail";

function InvoiceReviewContent() {
  const [phase, setPhase] = useState<TransitionPhase>("list");
  const [listFading, setListFading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState("INV-GRN-001");
  const [contentKey, setContentKey] = useState("INV-GRN-001");
  const [contentExiting, setContentExiting] = useState(false);
  const [variant, setVariant] = useState<Variant>("C");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = BETWEEN_INVOICE_STYLES;
    document.head.append(style);
    return () => {
      style.remove();
    };
  }, []);

  function handleRowClick(id: string) {
    setActiveInvoiceId(id);
    setContentKey(id);
    setListFading(true);
    setTimeout(() => setPhase("collapsing"), 100);
    setTimeout(() => setPhase("detail"), 500);
    setTimeout(() => setContentLoaded(true), 1100);
  }

  function handleBack() {
    setContentLoaded(false);
    setPhase("list");
    setListFading(false);
  }

  function handleNavInvoiceClick(id: string) {
    if (id === activeInvoiceId) return;
    setActiveInvoiceId(id);
    setContentExiting(true);
    setTimeout(() => {
      setContentExiting(false);
      setContentKey(id);
    }, 220);
  }

  const isDetail = phase !== "list";

  return (
    <ApolloShell
      companyName="UiPath"
      productName="Invoice Processing"
      navItems={[
        { path: "/invoice-review", label: "invoices", icon: FileText },
        { path: "/settings", label: "settings", icon: Settings2 },
      ]}
    >
      <div className="absolute inset-0 flex overflow-hidden">
        {/* Ambient glow — bleeds across left nav and center panel */}
        {isDetail && (
          <div
            className="inv-glow-in pointer-events-none absolute -top-20 -left-20 size-[480px] rounded-full blur-[110px] z-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 30%, oklch(0.65 0.04 207), oklch(0.48 0.16 290))",
            }}
          />
        )}
        {/* Left panel — animates from full-width list to 288px left nav */}
        <div
          className="relative overflow-hidden shrink-0"
          style={{
            width: isDetail ? "336px" : "100%",
            transition: "width 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* List content — fades out on row click */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: listFading ? 0 : 1,
              transition: "opacity 100ms ease-out",
              pointerEvents: listFading ? "none" : "auto",
            }}
          >
            <InvoiceListView onRowClick={handleRowClick} />
          </div>

          {/* Left nav — fades in as panel collapses */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: isDetail ? 1 : 0,
              transition: "opacity 220ms ease-out",
              transitionDelay: isDetail ? "160ms" : "0ms",
              pointerEvents: isDetail ? "auto" : "none",
            }}
          >
            <LeftNav
              activeId={activeInvoiceId}
              onInvoiceClick={handleNavInvoiceClick}
              onBack={handleBack}
              variant={variant}
              onVariantChange={setVariant}
            />
          </div>
        </div>

        {/* Detail content — revealed as left panel collapses */}
        {isDetail && (
          <div className="relative flex flex-col flex-1 overflow-hidden bg-gradient-to-r from-card/50 to-transparent detail-slide-in">
            {contentLoaded ? (
              <div
                key={contentKey}
                className={cn(
                  "flex flex-col flex-1 overflow-hidden",
                  contentExiting && "inv-between-exit",
                )}
              >
                <InvoiceDetailPane
                  activeInvoiceId={contentKey}
                  variant={variant}
                />
              </div>
            ) : (
              <DetailSkeleton />
            )}
          </div>
        )}
      </div>
    </ApolloShell>
  );
}

function createInvoiceRouter() {
  const root = createRootRoute();
  const index = createRoute({ getParentRoute: () => root, path: "/" });
  return createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

export function InvoiceReviewTemplate() {
  const [router] = useState(createInvoiceRouter);
  return (
    <RouterContextProvider router={router}>
      <Toaster />
      <InvoiceReviewContent />
    </RouterContextProvider>
  );
}
