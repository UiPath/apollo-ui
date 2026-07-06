"use client";

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Loader2,
  Mail,
  MessageSquare,
  MessageSquareOff,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkle,
  Sparkles,
  TriangleAlert,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { ApolloShell } from "@/components/ui/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import { Avatar, AvatarFallback, AvatarImage } from "@/registry/avatar/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/dialog/dialog";
import { ShellProfileExtrasProvider } from "@/registry/shell/shell-profile-extras";
import { Toaster } from "@/registry/sonner/sonner";
import { useDataTable } from "@/registry/use-data-table/useDataTable";
import {
  InvoiceVersionProvider,
  LayoutVersionMenuItem,
  useInvoiceVersion,
} from "./invoice-version";
import { ExceptionTimeline } from "./next/ExceptionTimeline";
import { HeaderDecision } from "./next/HeaderDecision";
import {
  exceptionMeta,
  findReview,
  getExceptionSummary,
  getReview,
  invoiceReviews,
  openExceptions,
} from "./next/invoice-review-data";
import {
  InvoiceRuntimeProvider,
  useInvoiceRuntime,
} from "./next/invoice-runtime";

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
  | "sent-for-approval"
  | "flagged"
  | "on-hold";

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
    unitPrice?: string;
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

// ── Canonical action model ──────────────────────────────────────────────────
// One action set per invoice. Every surface (Findings, Slack card) dispatches
// these same IDs; surfaces only choose which subset to show and how to label it.
type ActionId = "approve" | "hold" | "contact_supplier" | "reject" | "flag";
type ActionSource = "findings" | "slack";

const ACTION_LABELS: Record<ActionId, string> = {
  approve: "Approve",
  hold: "Hold",
  contact_supplier: "Contact supplier",
  reject: "Reject",
  flag: "Flag",
};

interface CommsAttachment {
  name: string;
  size: string;
}

interface CommsContextBlock {
  title: string;
  headline?: string;
  rows: { label: string; value: string; accent?: "error" | "warning" }[];
}

interface CommsAction {
  label: string;
  actionId: ActionId;
  variant: "primary" | "secondary";
}

interface CommsMessage {
  id: string;
  source: "email" | "slack";
  // Which email provider sent this — surfaces as an Outlook brand mark in
  // the card header so "Contact supplier" messages are attributed to the
  // Outlook channel. Leave undefined for generic / non-provider emails.
  provider?: "outlook";
  subtype: "plain" | "rich_block";
  from: {
    name: string;
    initials: string;
    type: "human" | "agent";
    avatarUrl?: string;
    company?: boolean;
  };
  toOrChannel: string;
  direction?: "inbound" | "outbound";
  timestamp: string;
  body: string;
  attachments?: CommsAttachment[];
  contextBlocks?: CommsContextBlock[];
  actions?: CommsAction[];
}

const detailDataMap: Record<string, InvoiceDetailData> = {
  "INV-GRN-001": {
    id: "INV-GRN-001",
    vendor: "ACME Industrial",
    vendorEmail: "accounts@acmeindustrial.com",
    amount: "$694.39 USD",
    currency: "USD",
    dueDate: "2026-05-28",
    dueFormatted: "May 28, 2026",
    documentDateFormatted: "Apr 10, 2026",
    po: "PO-460035919",
    paymentTerms: "Net 30 · USD",
    billTo: "Global Enterprises Inc",
    billAddress: "800 Corporate Center, Chicago IL 60601",
    assignee: "Peter Vachon",
    assigneeInitials: "PV",
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
      "Supplier agreed to discounted price per PO note. Invoice reflects original price. Request a corrected invoice from ACME Industrial before approving.",
    exceptionPrimaryAction: "Contact supplier",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "USB Hub, 7 Port Powered",
        qty: 1,
        amount: "$694.39",
        unitPrice: "$694.39",
        flag: "↑ price",
        flagStatus: "error",
        agreed: "$689.55",
      },
    ],
    linesTotal: "$694.39",
    linesAlert: {
      text: "Price exceeds PO by $4.84, could not auto-resolve.",
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
    dueDate: "2026-05-28",
    dueFormatted: "May 28, 2026",
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
      {
        description: "Ergonomic desk chair",
        qty: 20,
        amount: "$38,000.00",
        unitPrice: "$1,900.00",
      },
      {
        description: "Height-adjustable standing desk",
        qty: 10,
        amount: "$24,000.00",
        unitPrice: "$2,400.00",
      },
      {
        description: "Monitor arm (dual)",
        qty: 30,
        amount: "$3,800.00",
        unitPrice: "$126.67",
        flag: "high value",
        flagStatus: "warning",
      },
    ],
    linesTotal: "$65,800.00",
    linesAlert: {
      text: "Total exceeds $50,000 threshold. CFO approval required before payment.",
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
    dueDate: "2026-05-28",
    dueFormatted: "May 28, 2026",
    documentDateFormatted: "Apr 14, 2026",
    po: "—",
    paymentTerms: "Net 30 · USD",
    billTo: "Lakewood Manufacturing",
    billAddress: "1 Industrial Park Rd, Cleveland OH 44101",
    assignee: "Peter Vachon",
    assigneeInitials: "PV",
    vat: "—",
    description:
      "Quarterly facility maintenance supplies for the Cleveland manufacturing plant, including janitorial consumables and floor cleaning equipment.",
    exceptionTag: "Missing PO",
    exceptionTagStatus: "error",
    exceptionHeadline: "Facility supplies submitted without purchase order",
    exceptionMetrics: [
      { label: "Invoiced", value: "$12,240", cls: "text-foreground" },
      { label: "POs matched", value: "0", cls: "text-[#C0392B]" },
    ],
    exceptionBody:
      "No purchase order found matching this invoice. Contact the supplier to confirm whether supplies were ordered against a PO, or reject and request a PO-backed resubmission.",
    exceptionPrimaryAction: "Contact supplier",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "Janitorial supply kit",
        qty: 12,
        amount: "$4,080.00",
        unitPrice: "$340.00",
        flag: "Missing PO",
        flagStatus: "error",
      },
      {
        description: "Floor cleaning solution (5L)",
        qty: 24,
        amount: "$3,360.00",
        unitPrice: "$140.00",
        flag: "Missing PO",
        flagStatus: "error",
      },
      {
        description: "Industrial waste bags (case)",
        qty: 60,
        amount: "$4,800.00",
        unitPrice: "$80.00",
        flag: "Missing PO",
        flagStatus: "error",
      },
    ],
    linesTotal: "$12,240.00",
    linesAlert: {
      text: "No matching PO found. Payment blocked until a valid PO is provided.",
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
  "INV-77294": {
    id: "INV-77294",
    vendor: "Vertex Supplies Inc.",
    vendorEmail: "ar@vertexsupplies.com",
    amount: "$3,180.00 USD",
    currency: "USD",
    dueDate: "2026-05-29",
    dueFormatted: "May 29, 2026",
    documentDateFormatted: "Apr 13, 2026",
    po: "PO-771140082",
    paymentTerms: "Net 30 · USD",
    billTo: "Global Enterprises Inc",
    billAddress: "800 Corporate Center, Chicago IL 60601",
    assignee: "Peter Vachon",
    assigneeInitials: "PV",
    vat: "—",
    description:
      "IT peripherals and cabling for the New York office. Same invoice number was submitted twice within three weeks.",
    exceptionTag: "Duplicate",
    exceptionTagStatus: "warning",
    exceptionHeadline: "Possible duplicate: invoice number already paid",
    exceptionMetrics: [
      { label: "This invoice", value: "$3,180", cls: "text-foreground" },
      { label: "Prior payment", value: "$3,180", cls: "text-foreground" },
      { label: "Match", value: "Exact", cls: "text-[#EF9F27]" },
    ],
    exceptionBody:
      "Invoice number INV-77294 matches a payment already processed on Apr 2, 2026. Confirm with the supplier whether this is a resubmission before approving, or reject as a duplicate.",
    exceptionPrimaryAction: "Contact supplier",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "USB-C docking station",
        qty: 6,
        amount: "$1,440.00",
        unitPrice: "$240.00",
        flag: "duplicate",
        flagStatus: "warning",
      },
      {
        description: "CAT6 patch cable (3m, pack of 10)",
        qty: 12,
        amount: "$540.00",
        unitPrice: "$45.00",
      },
      {
        description: "Wireless keyboard + mouse set",
        qty: 20,
        amount: "$1,200.00",
        unitPrice: "$60.00",
      },
    ],
    linesTotal: "$3,180.00",
    linesAlert: {
      text: "Invoice number matches a payment processed on Apr 2, 2026.",
      status: "warning",
    },
    sourceFilename: "INV-77294.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-77294",
      "Date: April 13, 2026",
      "Due: May 13, 2026",
      "---",
      "From:",
      "Vertex Supplies Inc.",
      "210 Commerce Way",
      "Newark, NJ 07102",
      "---",
      "Bill To:",
      "Global Enterprises Inc",
      "800 Corporate Center",
      "Chicago, IL 60601",
      "---",
      "Items:",
      "USB-C docking station × 6 · $1,440.00",
      "CAT6 patch cable × 12 · $540.00",
      "Wireless keyboard + mouse × 20 · $1,200.00",
      "---",
      "Total: $3,180.00",
    ],
  },
  "INV-55832": {
    id: "INV-55832",
    vendor: "Meridian Group",
    vendorEmail: "billing@meridiangroup.eu",
    amount: "€22,500.00 EUR",
    currency: "EUR",
    dueDate: "2026-05-29",
    dueFormatted: "May 29, 2026",
    documentDateFormatted: "Apr 13, 2026",
    po: "PO-558120044",
    paymentTerms: "Net 30 · EUR",
    billTo: "Global Enterprises GmbH",
    billAddress: "Friedrichstraße 88, 10117 Berlin",
    assignee: "Maria Chen",
    assigneeInitials: "MC",
    vat: "DE-114299471",
    description:
      "Q2 legal retainer and litigation support for the EMEA entity, covering advisory hours, contract review, and filing fees.",
    exceptionTag: "High value",
    exceptionTagStatus: "warning",
    exceptionHeadline: "Legal services invoice above department limit",
    exceptionMetrics: [
      { label: "Amount", value: "€22,500", cls: "text-foreground" },
      { label: "Threshold", value: "€20,000", cls: "text-foreground" },
      { label: "Excess", value: "+€2,500", cls: "text-[#EF9F27]" },
    ],
    exceptionBody:
      "Invoice exceeds the €20,000 legal-department approval threshold. Department head sign-off is required before this payment can be processed.",
    exceptionPrimaryAction: "Request approval",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "Legal advisory retainer (Q2)",
        qty: 1,
        amount: "€12,000.00",
        unitPrice: "€12,000.00",
      },
      {
        description: "Contract review, 32 hrs @ €250",
        qty: 32,
        amount: "€8,000.00",
        unitPrice: "€250.00",
        flag: "high value",
        flagStatus: "warning",
      },
      {
        description: "Court filing fees",
        qty: 1,
        amount: "€2,500.00",
        unitPrice: "€2,500.00",
      },
    ],
    linesTotal: "€22,500.00",
    linesAlert: {
      text: "Total exceeds €20,000 threshold. Department head approval required.",
      status: "warning",
    },
    sourceFilename: "INV-55832.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-55832",
      "Date: April 13, 2026",
      "Due: May 13, 2026",
      "---",
      "From:",
      "Meridian Group",
      "Unter den Linden 21",
      "10117 Berlin, Germany",
      "---",
      "Bill To:",
      "Global Enterprises GmbH",
      "Friedrichstraße 88",
      "10117 Berlin",
      "---",
      "Items:",
      "Legal advisory retainer (Q2) · €12,000.00",
      "Contract review, 32 hrs · €8,000.00",
      "Court filing fees · €2,500.00",
      "---",
      "Total: €22,500.00",
    ],
  },
  "INV-60118": {
    id: "INV-60118",
    vendor: "Crestwood Co.",
    vendorEmail: "hello@crestwood.co",
    amount: "$940.00 USD",
    currency: "USD",
    dueDate: "2026-05-29",
    dueFormatted: "May 29, 2026",
    documentDateFormatted: "Apr 13, 2026",
    po: "—",
    paymentTerms: "Due on receipt · USD",
    billTo: "Global Enterprises Inc",
    billAddress: "800 Corporate Center, Chicago IL 60601",
    assignee: "Peter Vachon",
    assigneeInitials: "PV",
    vat: "—",
    description:
      "One-off purchase of branded notebooks and pens for a recruiting event. No purchase order was raised for this order.",
    exceptionTag: "Missing PO",
    exceptionTagStatus: "error",
    exceptionHeadline: "One-off purchase submitted without a PO",
    exceptionMetrics: [
      { label: "Invoiced", value: "$940", cls: "text-foreground" },
      { label: "POs matched", value: "0", cls: "text-[#C0392B]" },
    ],
    exceptionBody:
      "No purchase order is on file for this invoice. The amount is under the $1,000 one-off threshold. Confirm the requester with the supplier, then approve under petty-cash or reject for a PO-backed resubmission.",
    exceptionPrimaryAction: "Contact supplier",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "Branded notebooks (A5)",
        qty: 100,
        amount: "$600.00",
        unitPrice: "$6.00",
        flag: "Missing PO",
        flagStatus: "error",
      },
      {
        description: "Branded pens (box of 50)",
        qty: 4,
        amount: "$340.00",
        unitPrice: "$85.00",
        flag: "Missing PO",
        flagStatus: "error",
      },
    ],
    linesTotal: "$940.00",
    linesAlert: {
      text: "No PO found, under $1,000, may qualify for one-off approval.",
      status: "warning",
    },
    sourceFilename: "INV-60118.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-60118",
      "Date: April 13, 2026",
      "Due: April 13, 2026",
      "---",
      "From:",
      "Crestwood Co.",
      "55 Market Street",
      "Madison, WI 53703",
      "---",
      "Bill To:",
      "Global Enterprises Inc",
      "800 Corporate Center",
      "Chicago, IL 60601",
      "---",
      "Items:",
      "Branded notebooks (A5) × 100 · $600.00",
      "Branded pens (box of 50) × 4 · $340.00",
      "---",
      "Total: $940.00",
    ],
  },
  "INV-91003": {
    id: "INV-91003",
    vendor: "NorthStar LLC",
    vendorEmail: "invoices@northstarllc.co.uk",
    amount: "£8,750.00 GBP",
    currency: "GBP",
    dueDate: "2026-05-28",
    dueFormatted: "May 28, 2026",
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
        unitPrice: "£5,500.00",
      },
      {
        description: "Stakeholder workshop facilitation",
        qty: 1,
        amount: "£3,250.00",
        unitPrice: "£3,250.00",
        flag: "high value",
        flagStatus: "warning",
      },
    ],
    linesTotal: "£8,750.00",
    linesAlert: {
      text: "Total exceeds £5,000 consulting threshold. Department head sign-off required.",
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
  "INV-48209": {
    id: "INV-48209",
    vendor: "Folio Systems",
    vendorEmail: "ar@foliosystems.com",
    amount: "$7,620.00 USD",
    currency: "USD",
    dueDate: "2026-05-29",
    dueFormatted: "May 29, 2026",
    documentDateFormatted: "May 7, 2026",
    po: "PO-820044891",
    paymentTerms: "Net 30 · USD",
    billTo: "UiPath Inc.",
    billAddress: "2 Tower Place, South San Francisco, CA 94080",
    assignee: "Peter Vachon",
    assigneeInitials: "PV",
    vat: "N/A",
    description:
      "Software licensing and implementation services for Folio Systems document management platform, Q2 2026.",
    exceptionTag: "New vendor",
    exceptionTagStatus: "info",
    exceptionHeadline: "First invoice from unverified vendor",
    exceptionMetrics: [
      { label: "Invoiced", value: "$7,620", cls: "text-foreground" },
      { label: "PO matched", value: "1", cls: "text-foreground" },
    ],
    exceptionBody:
      "Folio Systems is not in the approved vendor master. PO-820044891 was located and amounts match exactly. Approve to add vendor to master list and process payment, or reject to request procurement sign-off first.",
    exceptionPrimaryAction: "Approve",
    exceptionSecondaryAction: "Reject invoice",
    lines: [
      {
        description: "Document management platform license (annual)",
        qty: 1,
        amount: "$5,400.00",
        unitPrice: "$5,400.00",
      },
      {
        description: "Implementation & onboarding services",
        qty: 12,
        amount: "$2,220.00",
        unitPrice: "$185.00",
      },
    ],
    linesTotal: "$7,620.00",
    sourceFilename: "INV-48209.pdf",
    sourceLines: [
      "INVOICE",
      "Invoice #: INV-48209",
      "Date: May 7, 2026",
      "Due: May 15, 2026",
      "---",
      "From:",
      "Folio Systems",
      "800 Technology Drive",
      "Austin, TX 78701",
      "---",
      "Bill To:",
      "UiPath Inc.",
      "2 Tower Place",
      "South San Francisco, CA 94080",
      "---",
      "PO: PO-820044891",
      "---",
      "Items:",
      "Document mgmt license × 1 · $5,400.00",
      "Implementation services × 12 · $2,220.00",
      "---",
      "Total: $7,620.00",
    ],
  },
};

const commsDataMap: Record<string, CommsMessage[]> = {};

const InvoiceDetailContext = createContext<InvoiceDetailData>(
  detailDataMap["INV-GRN-001"] as InvoiceDetailData,
);
const useInvoiceDetail = () => useContext(InvoiceDetailContext);

// "My queue" is derived: the invoices assigned to the current reviewer (from
// the shared fixtures), not a hardcoded list. dueGroup is queue-view metadata
// (a demo grouping), so it lives here rather than in the invoice record.
const REVIEWER_QUEUE_NAME = "Peter Vachon";
const QUEUE_DUE_GROUP: Record<string, "today" | "tomorrow"> = {
  "INV-84471": "today",
  "INV-66216": "today",
  "INV-91003": "today",
  "INV-GRN-001": "today",
  "INV-55832": "tomorrow",
  "INV-60118": "tomorrow",
  "INV-77294": "tomorrow",
  "INV-48209": "tomorrow",
};

const invoicesReview: Invoice[] = invoiceReviews
  .filter((r) => r.assignee.name === REVIEWER_QUEUE_NAME)
  .map((r) => ({
    id: r.id,
    vendor: r.supplier,
    // Compact amount for the narrow rail (drop cents + currency code).
    amount: r.amount.replace(/\.\d+/, "").split(" ")[0],
    score: 3,
    dueGroup: QUEUE_DUE_GROUP[r.id] ?? "today",
  }));

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
    dueDate: "2026-05-28",
    exception: "price-mismatch",
    score: 3,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-66216",
    vendor: "Prime Office Solutions",
    amount: 65800,
    currency: "USD",
    dueDate: "2026-05-28",
    exception: "high-value",
    score: 4,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-84471",
    vendor: "Acme Supply Co.",
    amount: 12240,
    currency: "USD",
    dueDate: "2026-05-28",
    exception: "no-po-match",
    score: 2,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-91003",
    vendor: "NorthStar LLC",
    amount: 8750,
    currency: "GBP",
    dueDate: "2026-05-28",
    exception: "high-value",
    score: 4,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-77294",
    vendor: "Vertex Supplies Inc.",
    amount: 3180,
    currency: "USD",
    dueDate: "2026-05-29",
    exception: "duplicate",
    score: 3,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-55832",
    vendor: "Meridian Group",
    amount: 22500,
    currency: "EUR",
    dueDate: "2026-05-29",
    exception: "high-value",
    score: 4,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-60118",
    vendor: "Crestwood Co.",
    amount: 940,
    currency: "USD",
    dueDate: "2026-05-29",
    exception: "missing-po",
    score: 2,
    status: "pending-review",
    assignee: "Peter Vachon",
  },
  {
    id: "INV-48209",
    vendor: "Folio Systems",
    amount: 7620,
    currency: "USD",
    dueDate: "2026-05-29",
    exception: "new-vendor",
    score: 4,
    status: "pending-review",
    assignee: "Peter Vachon",
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
    assignee: "Peter Vachon",
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
    assignee: "Peter Vachon",
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
    assignee: "Peter Vachon",
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
    assignee: "Peter Vachon",
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

type RightTab = "details" | "lines" | "source" | "comms" | "activity" | "email";

const BETWEEN_INVOICE_STYLES = `
  @keyframes inv-between-enter {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .inv-between-enter {
    animation: inv-between-enter 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }
  @keyframes inv-between-exit {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-40px); }
  }
  .inv-between-exit {
    animation: inv-between-exit 130ms cubic-bezier(0.4, 0, 1, 1) both;
    pointer-events: none;
  }
  @keyframes detail-slide-in {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .detail-slide-in {
    animation: detail-slide-in 190ms cubic-bezier(0.4, 0, 0.2, 1) 40ms both;
  }
  @keyframes skeleton-content-enter {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .skeleton-content-enter {
    animation: skeleton-content-enter 180ms ease-out both;
  }
  @keyframes inv-glow-in {
    from { opacity: 0; }
    to   { opacity: 0.04; }
  }
  .inv-glow-in {
    animation: inv-glow-in 480ms ease-out 320ms both;
  }
  @keyframes fadeSlideIn {
    from { transform: translateY(-6px); }
    to   { transform: translateY(0); }
  }
  .entry-new {
    animation: fadeSlideIn 150ms ease forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .ai-panel-glow {
    background: linear-gradient(
      to left,
      oklch(0.68 0.18 285 / 0.04) 0%,
      transparent 100%
    );
  }
  .dark .ai-panel-glow {
    background: linear-gradient(
      to left,
      oklch(0.68 0.18 285 / 0.06) 0%,
      transparent 100%
    );
  }
  /* AI gradient stops for the active Findings tab — darker on light bg,
     lighter on dark bg for accessibility. */
  :root {
    --findings-ai-start: #5A4ACD;
    --findings-ai-end: #2E9DB7;
  }
  .dark {
    --findings-ai-start: #9583F2;
    --findings-ai-end: #7FD1E5;
  }
  .findings-ai-gradient {
    background-image: linear-gradient(
      97.73deg,
      var(--findings-ai-start) 8.79%,
      var(--findings-ai-end) 91.48%
    );
  }
`;

// ── Primitives ────────────────────────────────────────────────────────────────

function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hues = [250, 180, 140, 290, 30, 200];
  return `oklch(0.50 0.14 ${hues[h % hues.length]})`;
}

// The current logged-in reviewer — matches the real Slack user driving the demo.
const REVIEWER_NAME = "Peter Vachon";
const REVIEWER_INITIALS = "PV";
const REVIEWER_AVATAR = "/peter-vachon.jpg";
// Publicly reachable avatar for Slack — chat:write.customize fetches icon_url
// from Slack's servers, so the bundled local /peter-vachon.jpg won't render
// in the thread. If the reviewer ever changes, swap this for their public URL.
const REVIEWER_AVATAR_PUBLIC =
  "https://ca.slack-edge.com/EJB4CMA2H-U09A4BKS7N0-00c173f481f1-512";

// Slack brand mark — inline SVG of the four-color logo (pink/blue/green/
// yellow), used wherever the UI attributes content to Slack as a source.
// Inlined (rather than lucide-react's stylized `Slack`, which loses the four
// shapes at small sizes) so leadership recognizes Slack at a glance. Default
// 14px; the four shapes stay distinct down to ~12px.
function SlackBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 127 127"
      className={cn("size-3.5 shrink-0", className)}
    >
      <path
        d="M27.2 80a13.2 13.2 0 1 1-13.2-13.2h13.2V80Zm6.6 0a13.2 13.2 0 1 1 26.4 0v33a13.2 13.2 0 1 1-26.4 0V80Z"
        fill="#E01E5A"
      />
      <path
        d="M47 27a13.2 13.2 0 1 1 13.2-13.2V27H47Zm0 6.7a13.2 13.2 0 1 1 0 26.4H13.9a13.2 13.2 0 1 1 0-26.4H47Z"
        fill="#36C5F0"
      />
      <path
        d="M99.9 46.9a13.2 13.2 0 1 1 13.2 13.2H99.9V46.9Zm-6.6 0a13.2 13.2 0 1 1-26.4 0V13.8a13.2 13.2 0 1 1 26.4 0v33.1Z"
        fill="#2EB67D"
      />
      <path
        d="M80.1 99.8a13.2 13.2 0 1 1-13.2 13.2V99.8h13.2Zm0-6.6a13.2 13.2 0 1 1 0-26.4h33.1a13.2 13.2 0 1 1 0 26.4H80.1Z"
        fill="#ECB22E"
      />
    </svg>
  );
}

// Microsoft Outlook brand mark — used in the Comms card header when an
// email was sent via Outlook (currently: every "Contact supplier" send).
// Inline SVG keeps the recognizable blue-on-white envelope + "O" at small
// sizes without pulling in a dep.
function OutlookBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("size-3.5 shrink-0", className)}
    >
      <path
        fill="#0078D4"
        d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86 0-.46.1-.86.11-.41.33-.73.22-.31.58-.5.37-.2.87-.2t.86.2q.36.18.58.51.22.32.33.73.1.41.1.88ZM24 12v9.38q0 .46-.33.8-.34.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25ZM18 3.75v3h3v-3Zm0 4.5v3h3v-3Zm0 4.5v1.83l3.05-1.83Zm-5.25-9v3h3.75v-3Zm0 4.5v3h3.75v-3Zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73ZM9 3.75V6h2l.13.01.12.04v-2.3ZM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.74-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.27.75-.27 1.65 0 .84.26 1.55.26.71.74 1.23.48.52 1.17.81.69.3 1.57.3ZM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5Zm15-.13v-7.24l-5.9 3.54Z"
      />
    </svg>
  );
}

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
  "no-po-match": { label: "Missing PO", status: "error" },
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
  flagged: { label: "Flagged", status: "warning" },
  "on-hold": { label: "On hold", status: "warning" },
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
  { label: "Missing PO", value: "no-po-match" },
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

// Exception cell for known review records: the lead exception (canonical label
// + tone) plus a muted "+N" for the rest, or "Cleared" once all are resolved.
// Reads the shared runtime store so it stays live. Rows that aren't real review
// records (dashboard-only fillers) fall back to their static exception.
function TableExceptionCell({
  id,
  fallback,
}: {
  id: string;
  fallback: ExceptionType;
}) {
  const runtime = useInvoiceRuntime();
  const review = findReview(id);
  if (review) {
    const open = openExceptions(review, runtime.getRuntime(id));
    if (open.length === 0) {
      return <Badge variant="secondary">Cleared</Badge>;
    }
    const [lead, ...others] = open;
    const meta = exceptionMeta(lead);
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" status={meta.tone}>
          {meta.label}
        </Badge>
        {others.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              className="cursor-default text-xs font-medium text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              +{others.length}
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <ul className="space-y-0.5">
                {others.map((e) => (
                  <li key={e.id}>
                    {exceptionMeta(e).label}
                    {e.scope.level === "line" ? ` · Line ${e.scope.line}` : ""}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }
  const map = exceptionBadgeMap[fallback];
  if (map.status === null) {
    return <span className="text-[13px] text-muted-foreground">5/5</span>;
  }
  return (
    <Badge variant="secondary" status={map.status}>
      {map.label}
    </Badge>
  );
}

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
      return <span className="tabular-nums">{formatted}</span>;
    },
  },
  {
    accessorKey: "exception",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Exception" />
    ),
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- filterFn is Row<RowData> but compatible at runtime
    filterFn: dataTableFacetedFilterFn as FilterFn<InvoiceTableRow>,
    cell: ({ row }) => (
      <TableExceptionCell
        id={row.original.id}
        fallback={row.getValue<ExceptionType>("exception")}
      />
    ),
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
  {
    accessorKey: "assignee",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assignee" />
    ),
    cell: ({ row }) => {
      const name = row.getValue<string>("assignee");
      // Reviewer (Peter) gets the photo avatar; others fall back to colored
      // initials so the list still reads at a glance.
      const isReviewer = name === REVIEWER_NAME;
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const initials = (
        parts.length >= 2
          ? parts[0][0] + parts[parts.length - 1][0]
          : name.slice(0, 2)
      ).toUpperCase();
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="size-5 shrink-0">
            {isReviewer && <AvatarImage src={REVIEWER_AVATAR} alt={name} />}
            <AvatarFallback
              className="text-[9px] font-semibold text-white"
              style={{ background: avatarBg(name) }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate">{name}</span>
        </div>
      );
    },
  },
];

function AvatarChip({ type }: { type: "ai-pass" | "ai-fail" | "user" }) {
  const isAI = type === "ai-pass" || type === "ai-fail";
  if (type === "user") {
    return (
      <Avatar className="size-[14px] shrink-0">
        <AvatarImage src={REVIEWER_AVATAR} alt={REVIEWER_NAME} />
        <AvatarFallback className="text-[7px] font-bold text-white bg-muted-foreground">
          {REVIEWER_INITIALS}
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <div
      className={cn(
        "size-[14px] rounded-full flex items-center justify-center shrink-0",
        isAI && "bg-gradient-to-br from-[#7C6AF5] to-[#5B8EF0]",
      )}
    >
      <Sparkle
        className="size-[8px] text-background"
        fill="currentColor"
        strokeWidth={0}
      />
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
  "assignee",
];
const LIST_VISIBLE_COLUMNS = [
  "id",
  "vendor",
  "amount",
  "dueDate",
  "exception",
  "status",
  "assignee",
];

type CardFilterKey =
  | "due-today"
  | "pending-review"
  | "exceptions"
  | "auto-approved"
  | null;

function InvoiceListView({
  onRowClick,
  completionMap,
  parkedMap,
}: {
  onRowClick: (id: string) => void;
  completionMap: Record<string, CompletionRecord>;
  parkedMap: Record<string, ParkedState>;
}) {
  const [timeRange, setTimeRange] = useState("30d");
  const [cardFilter, setCardFilter] = useState<CardFilterKey>(null);

  // Reflect live actions (approve/reject/flag/hold) in each row's status.
  const liveData = useMemo(
    () =>
      invoiceTableData.map((r) => {
        const c = completionMap[r.id];
        if (c) {
          return {
            ...r,
            status: (c.type === "approved"
              ? "approved"
              : "rejected") as InvoiceStatus,
          };
        }
        const p = parkedMap[r.id];
        if (p) {
          return {
            ...r,
            status: (p.kind === "hold"
              ? "on-hold"
              : "flagged") as InvoiceStatus,
          };
        }
        return r;
      }),
    [completionMap, parkedMap],
  );

  const sortedData = useMemo(() => {
    return [...liveData].sort((a, b) => {
      const pa = exceptionPriority[a.exception] ?? 0;
      const pb = exceptionPriority[b.exception] ?? 0;
      if (pa !== pb) return pb - pa;
      return a.score - b.score;
    });
  }, [liveData]);

  // Demo "today" is pinned so the filter and the queue's "Due today" bucket
  // line up regardless of the machine's actual date — the seed data is dated
  // May 28–29, 2026 to keep dates close to the May 2026 invoice records.
  const todayISO = "2026-05-28";

  const filteredData = useMemo(() => {
    switch (cardFilter) {
      case "due-today":
        return sortedData.filter((r) => r.dueDate === todayISO);
      case "pending-review":
        return sortedData.filter(
          (r) => r.status === "pending-review" || r.status === "in-review",
        );
      case "exceptions":
        return sortedData.filter((r) => r.exception !== "none");
      case "auto-approved":
        return sortedData.filter((r) => r.status === "approved");
      default:
        return sortedData;
    }
  }, [sortedData, cardFilter, todayISO]);

  const tableState = useDataTable({
    data: filteredData,
    columns: invoiceColumns,
    storageKey: "invoice-review-list-v6",
    defaultColumnOrder: LIST_COLUMN_ORDER,
    defaultVisibleColumns: LIST_VISIBLE_COLUMNS,
  });

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

  function getUrgencyClass(row: InvoiceTableRow): string {
    if (row.score === 5) return "opacity-40";
    return "";
  }

  function toggleCard(key: NonNullable<CardFilterKey>) {
    setCardFilter((prev) => (prev === key ? null : key));
    tableState.onPaginationChange((prev) => ({ ...prev, pageIndex: 0 }));
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Invoices</PageHeaderTitle>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Updated 1 minute ago
          </span>
        </PageHeaderNav>
        <PageHeaderActions>
          <FilterDropdown
            title="Time"
            options={timeFilterOptions}
            multiSelect={false}
            value={timeRange}
            onChange={(v) => {
              if (typeof v === "string") setTimeRange(v);
            }}
          />
          <Button variant="secondary">Upload Invoice</Button>
          <Button
            onClick={() => {
              const first = sortedData[0];
              if (first) onRowClick(first.id);
            }}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Start review
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Four metric cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* Due today */}
          <Card
            variant="glass"
            className={cn(
              "cursor-pointer transition-all py-0",
              cardFilter === "due-today" && "border-2 border-destructive",
            )}
            onClick={() => toggleCard("due-today")}
          >
            <CardContent className="px-5 pt-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Due today</p>
                {cardFilter === "due-today" && (
                  <p className="text-xs text-muted-foreground cursor-pointer">
                    ✕ Clear
                  </p>
                )}
              </div>
              <p className="text-3xl font-medium text-destructive mt-1">
                {dueTodayCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {invoiceTableData.length} total
              </p>
            </CardContent>
          </Card>

          {/* Pending review */}
          <Card
            variant="glass"
            className={cn(
              "cursor-pointer transition-all py-0",
              cardFilter === "pending-review" && "border-2 border-warning",
            )}
            onClick={() => toggleCard("pending-review")}
          >
            <CardContent className="px-5 pt-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Pending review</p>
                {cardFilter === "pending-review" && (
                  <p className="text-xs text-muted-foreground cursor-pointer">
                    ✕ Clear
                  </p>
                )}
              </div>
              <p className="text-3xl font-medium text-warning mt-1">
                {pendingCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                need a decision
              </p>
            </CardContent>
          </Card>

          {/* Exceptions flagged */}
          <Card
            variant="glass"
            className={cn(
              "cursor-pointer transition-all py-0",
              cardFilter === "exceptions" && "border-2 border-foreground",
            )}
            onClick={() => toggleCard("exceptions")}
          >
            <CardContent className="px-5 pt-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Exceptions flagged
                </p>
                {cardFilter === "exceptions" && (
                  <p className="text-xs text-muted-foreground cursor-pointer">
                    ✕ Clear
                  </p>
                )}
              </div>
              <p className="text-3xl font-medium text-foreground mt-1">
                {exceptCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                agent identified
              </p>
            </CardContent>
          </Card>

          {/* Auto-approved */}
          <Card
            variant="glass"
            className={cn(
              "cursor-pointer transition-all py-0",
              cardFilter === "auto-approved"
                ? "border-2 border-foreground"
                : "opacity-50",
            )}
            onClick={() => toggleCard("auto-approved")}
          >
            <CardContent className="px-5 pt-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Auto-approved</p>
                {cardFilter === "auto-approved" && (
                  <p className="text-xs text-muted-foreground cursor-pointer">
                    ✕ Clear
                  </p>
                )}
              </div>
              <p className="text-3xl font-medium text-muted-foreground mt-1">
                {autoCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                no action needed
              </p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          {...tableState}
          globalFilterFn={typedGlobalFilterFn}
          onRowClick={(row) => onRowClick(row.id)}
          getRowClassName={getUrgencyClass}
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

const TONE_DOT: Record<string, string> = {
  error: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

function NavInvoiceItem({
  invoice,
  isActive,
  onClick,
  completion,
  parked,
  contacted = false,
}: {
  invoice: Invoice;
  isActive: boolean;
  onClick: () => void;
  completion?: CompletionRecord;
  parked?: ParkedState;
  // True once the reviewer has sent a "Contact supplier" email for this
  // invoice — shown as a secondary status in the queue card so the open
  // action is visible without opening the invoice.
  contacted?: boolean;
}) {
  const isAuto = invoice.status === "done";
  const isCompleted = !!completion;
  // Parked (flag/hold) only applies when not already approved/rejected.
  const isParked = !isCompleted && !!parked;

  // Exception display derives from the shared model + live loop state, so the
  // queue never disagrees with the workspace or the table.
  const runtime = useInvoiceRuntime();
  const summary =
    isAuto || isCompleted
      ? null
      : getExceptionSummary(
          getReview(invoice.id),
          runtime.getRuntime(invoice.id),
        );
  const lead = summary?.lead ?? null;
  const extraCount = summary?.extraCount ?? 0;
  const waitingCount = summary?.waitingCount ?? 0;
  const waitingOn = summary?.waitingOn ?? null;
  // Nothing open but a routed exception is parked: waiting, not ready.
  const isWaiting = !!summary && summary.openCount === 0 && waitingCount > 0;
  const isReady = !!summary && summary.openCount === 0 && waitingCount === 0;

  const dotColor = isCompleted
    ? completion.type === "approved"
      ? "bg-success"
      : "bg-destructive"
    : isParked
      ? "bg-warning"
      : isWaiting
        ? "bg-info"
        : isAuto || isReady
          ? "bg-success"
          : lead
            ? (TONE_DOT[exceptionMeta(lead).tone] ?? "bg-muted-foreground")
            : "bg-muted-foreground";

  const tagLabel = isCompleted
    ? completion.type === "approved"
      ? "Approved"
      : "Rejected"
    : isParked
      ? parked?.kind === "hold"
        ? "On hold"
        : "Flagged"
      : isWaiting
        ? `Waiting on ${waitingOn}`
        : isAuto
          ? "Done"
          : isReady
            ? "Ready to approve"
            : lead
              ? exceptionMeta(lead).label
              : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left group",
        (isAuto || isCompleted) && "opacity-40",
      )}
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
          <div className="flex items-center gap-1 shrink-0 min-w-0">
            <div className={cn("size-1.5 rounded-full shrink-0", dotColor)} />
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {tagLabel}
            </span>
            {/* Muted "+N" for the extra open exceptions behind the lead. */}
            {extraCount > 0 && (
              <span className="ml-1.5 shrink-0 text-xs font-medium text-muted-foreground">
                +{extraCount}
              </span>
            )}
            {/* Secondary status: only shows for in-flight (not completed,
                not parked) invoices so it doesn't compete with terminal
                states like Approved/Rejected. */}
            {contacted && !isCompleted && !isParked && (
              <span className="text-[11px] font-medium text-muted-foreground/70 truncate">
                · Contacted supplier
              </span>
            )}
          </div>
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
  completionMap,
  parkedMap,
  contactedMap,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  position,
  total,
}: {
  activeId: string;
  onInvoiceClick: (id: string) => void;
  onBack: () => void;
  completionMap: Record<string, CompletionRecord>;
  parkedMap: Record<string, ParkedState>;
  contactedMap: Record<string, boolean>;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  position: number;
  total: number;
}) {
  // Approved/rejected invoices move out of their due-date section into
  // "Completed". Flagged/held stay put (still in the active queue).
  const isDone = (id: string) => !!completionMap[id];
  // Waiting-only: nothing open, but a routed exception is parked waiting on an
  // outside reply. These leave their due-date group for a dedicated "Waiting"
  // group. A mix of open + waiting stays in the due group (still actionable).
  // Single derivation via getExceptionSummary keeps queue structure cheap to
  // restructure (ownership in flux).
  const runtime = useInvoiceRuntime();
  const isWaitingOnly = (id: string) => {
    if (isDone(id)) return false;
    const s = getExceptionSummary(getReview(id), runtime.getRuntime(id));
    return s.openCount === 0 && s.waitingCount > 0;
  };
  const dueToday = dueTodayInvoices.filter(
    (inv) => !isDone(inv.id) && !isWaitingOnly(inv.id),
  );
  const dueTomorrow = invoicesReview.filter(
    (inv) =>
      inv.dueGroup === "tomorrow" && !isDone(inv.id) && !isWaitingOnly(inv.id),
  );
  const waiting = invoicesReview.filter((inv) => isWaitingOnly(inv.id));
  const completed = invoicesReview.filter((inv) => isDone(inv.id));

  return (
    <div className="h-full w-[336px] flex flex-col shrink-0 overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          boxShadow:
            "inset -1px 0 0 0 color-mix(in srgb, var(--color-border) 50%, transparent)",
        }}
      />
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border-b border-border/50">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to all invoices"
          title="Back to all invoices"
          className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="size-3.5" />
        </button>
        <span className="text-[13px] font-semibold flex-1 truncate">
          My queue{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({invoicesReview.length})
          </span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar [mask-image:linear-gradient(to_bottom,transparent_0,black_24px,black_calc(100%_-_56px),transparent_100%)]">
        {dueToday.length > 0 && (
          <>
            <NavSectionLabel label="Due today" count={dueToday.length} first />
            <div className="space-y-2 pb-4">
              {dueToday.map((inv) => (
                <NavInvoiceItem
                  key={inv.id}
                  invoice={inv}
                  isActive={inv.id === activeId}
                  onClick={() => onInvoiceClick(inv.id)}
                  completion={completionMap[inv.id]}
                  parked={parkedMap[inv.id]}
                  contacted={contactedMap[inv.id]}
                />
              ))}
            </div>
          </>
        )}

        {dueTomorrow.length > 0 && (
          <>
            <NavSectionLabel
              label="Due tomorrow"
              count={dueTomorrow.length}
              first={dueToday.length === 0}
            />
            <div className="space-y-2 pb-4">
              {dueTomorrow.map((inv) => (
                <NavInvoiceItem
                  key={inv.id}
                  invoice={inv}
                  isActive={inv.id === activeId}
                  onClick={() => onInvoiceClick(inv.id)}
                  completion={completionMap[inv.id]}
                  parked={parkedMap[inv.id]}
                  contacted={contactedMap[inv.id]}
                />
              ))}
            </div>
          </>
        )}

        {waiting.length > 0 && (
          <>
            <NavSectionLabel
              label="Waiting"
              count={waiting.length}
              first={dueToday.length === 0 && dueTomorrow.length === 0}
            />
            <div className="space-y-2 pb-4">
              {waiting.map((inv) => (
                <NavInvoiceItem
                  key={inv.id}
                  invoice={inv}
                  isActive={inv.id === activeId}
                  onClick={() => onInvoiceClick(inv.id)}
                  completion={completionMap[inv.id]}
                  parked={parkedMap[inv.id]}
                  contacted={contactedMap[inv.id]}
                />
              ))}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <>
            <NavSectionLabel label="Completed" count={completed.length} />
            <div className="space-y-2 pb-4">
              {completed.map((inv) => (
                <NavInvoiceItem
                  key={inv.id}
                  invoice={inv}
                  isActive={inv.id === activeId}
                  onClick={() => onInvoiceClick(inv.id)}
                  completion={completionMap[inv.id]}
                  parked={parkedMap[inv.id]}
                  contacted={contactedMap[inv.id]}
                />
              ))}
            </div>
          </>
        )}

        <NavSectionLabel label="Auto-approved" count={invoicesAuto.length} />
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

      {/* Prev / Next footer */}
      <div className="shrink-0 border-t border-border px-4 py-2.5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous invoice"
          disabled={!hasPrev}
          onClick={onPrev}
          className="size-8 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {position} of {total}
        </span>
        <button
          type="button"
          aria-label="Next invoice"
          disabled={!hasNext}
          onClick={onNext}
          className="size-8 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({
  flagged,
  held,
  completion,
}: {
  flagged: boolean;
  held?: boolean;
  completion?: CompletionRecord;
}) {
  const d = useInvoiceDetail();
  const runtime = useInvoiceRuntime();
  // A data-changing resolution (e.g. Link PO-5123) patches the shared record.
  const patchedPo = runtime.getRuntime(d.id).dataPatch?.purchaseOrder ?? d.po;
  // Mirror the list view's Status column: row's data status, overridden by
  // live completion/parked state so the header label stays in sync.
  const tableRow = invoiceTableData.find((r) => r.id === d.id);
  const baseStatus: InvoiceStatus = tableRow?.status ?? "pending-review";
  const effectiveStatus: InvoiceStatus = completion
    ? completion.type === "approved"
      ? "approved"
      : "rejected"
    : held
      ? "on-hold"
      : flagged
        ? "flagged"
        : baseStatus;
  const statusInfo = statusBadgeMap[effectiveStatus];
  return (
    <PageHeader bordered className="@3xl:!grid-cols-[auto_1fr]">
      <PageHeaderNav>
        <PageHeaderTitleGroup>
          <PageHeaderTitle as="h2">
            <span className="group inline-flex items-center gap-1 cursor-pointer">
              <span className="group-hover:underline">{d.id}</span>
              <ExternalLink className="size-3.5 shrink-0 text-foreground opacity-0 -translate-x-1 transition-all duration-120 group-hover:opacity-60 group-hover:translate-x-0" />
            </span>
          </PageHeaderTitle>
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
          <PageHeaderFieldValue>
            {!patchedPo || patchedPo === "—" ? (
              <Badge status="error" variant="secondary">
                Missing PO
              </Badge>
            ) : (
              patchedPo
            )}
          </PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
          <PageHeaderFieldValue className="flex items-center gap-1 transition-colors duration-180">
            <Badge status={statusInfo.status} variant="secondary">
              {statusInfo.label}
            </Badge>
          </PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Assignee</PageHeaderFieldLabel>
          <PageHeaderFieldValue className="flex items-center gap-1.5">
            <Avatar className="size-[14px] shrink-0">
              {d.assignee === REVIEWER_NAME && (
                <AvatarImage src={REVIEWER_AVATAR} alt={d.assignee} />
              )}
              <AvatarFallback className="text-[7px] font-bold text-background bg-muted-foreground">
                {d.assigneeInitials[0]}
              </AvatarFallback>
            </Avatar>
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
              "size-3 transition-transform duration-100",
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
              "size-3 transition-transform duration-100",
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
              "size-3 transition-transform duration-100",
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
    desc: "Skipped, halted at price check.",
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
              <span className="text-muted-foreground"> · {item.desc}</span>
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
    `Invoice correction request: Invoice ${data.id}`,
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
          <Send className="size-3.5" />
          {sending ? "Sending…" : "Send Email"}
        </Button>
      </div>
    </div>
  );
}

// ── AnimatedCheck ─────────────────────────────────────────────────────────────

function AnimatedCheck({ size = 40 }: { size?: number }) {
  const r = (size - 4) / 2;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth="2"
        fill="none"
        style={{ stroke: "var(--success)" }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
      <motion.path
        d={`M ${cx - r * 0.38} ${cy} l ${r * 0.3} ${r * 0.3} l ${r * 0.5} ${-r * 0.5}`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: "var(--success)" }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut", delay: 0.35 }}
      />
    </svg>
  );
}

// ── UpNextCard ────────────────────────────────────────────────────────────────

function UpNextCard({
  nextInvoice,
  onNext,
  onBack,
}: {
  nextInvoice: Invoice | null;
  onNext: () => void;
  onBack: () => void;
}) {
  if (!nextInvoice) return null;
  return (
    <div>
      <Card className="mt-0">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Up next
            </p>
            <p className="text-sm font-medium">
              {nextInvoice.id} · {nextInvoice.vendor}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nextInvoice.tag ?? "No exception"} · {nextInvoice.amount} · Due{" "}
              {nextInvoice.dueGroup === "today"
                ? "today"
                : nextInvoice.dueGroup === "tomorrow"
                  ? "tomorrow"
                  : "soon"}
            </p>
          </div>
          <Button variant="default" size="sm" onClick={onNext}>
            Next
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-muted-foreground"
        onClick={onBack}
      >
        ← Back to queue
      </Button>
    </div>
  );
}

// ── ActionBlock ───────────────────────────────────────────────────────────────

// Maps the display tag on each invoice back to its canonical exception type.
const EXCEPTION_TYPE_BY_TAG: Record<string, ExceptionType> = {
  "Price mismatch": "price-mismatch",
  "High value": "high-value",
  "Missing PO": "missing-po",
  Duplicate: "duplicate",
  "New vendor": "new-vendor",
};

// Which canonical actions Findings shows per exception type, in priority order.
// Index 0 is the primary (filled) action; the rest are outlined.
const FINDINGS_ACTIONS: Record<ExceptionType, ActionId[]> = {
  "no-po-match": ["contact_supplier", "reject", "flag"],
  "price-mismatch": ["approve", "hold", "reject", "flag"],
  "high-value": ["approve", "reject", "flag"],
  duplicate: ["reject", "approve", "flag"],
  "missing-po": ["contact_supplier", "reject", "flag"],
  "new-vendor": ["approve", "reject", "flag"],
  none: ["approve", "flag"],
};

const HOLD_DEFAULT_REASON = "Awaiting corrected invoice";

function ActionBlock({
  emailButtonState = "default",
  onAction,
  onUndo,
  confirmed,
}: {
  emailButtonState?: "default" | "draft-open" | "sent";
  onAction: (id: ActionId, opts?: { reason?: string; note?: string }) => void;
  onUndo: (kind: "flag" | "hold") => void;
  confirmed: { kind: "flag" | "hold"; reason: string } | null;
}) {
  const { exceptionTag, id, vendor, amount } = useInvoiceDetail();
  const exceptionType = EXCEPTION_TYPE_BY_TAG[exceptionTag] ?? "none";
  const actions = FINDINGS_ACTIONS[exceptionType] ?? ["approve", "flag"];

  const [drafting, setDrafting] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState<FlagReason>(
    "Awaiting supplier response",
  );
  const [flagNote, setFlagNote] = useState("");

  // Reject dialog state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] =
    useState<RejectReason>("Incorrect price");
  const [rejectNote, setRejectNote] = useState("");

  function handleContact() {
    setDrafting(true);
    setTimeout(() => {
      setDrafting(false);
      onAction("contact_supplier");
    }, 1000);
  }

  function handleFlagSubmit() {
    setFlagOpen(false);
    onAction("flag", {
      reason: flagReason,
      note: flagNote.trim() || undefined,
    });
  }

  function handleRejectSubmit() {
    setRejectOpen(false);
    onAction("reject", { reason: rejectReason });
  }

  function renderAction(actionId: ActionId, primary: boolean) {
    const variantClass = primary ? "default" : "outline";

    if (actionId === "approve") {
      return (
        <Button
          key={actionId}
          variant={variantClass}
          onClick={() => onAction("approve")}
          className={cn(
            "transition-all duration-100",
            primary &&
              "bg-primary dark:text-gray-900 hover:bg-primary/90 border-0",
          )}
        >
          {ACTION_LABELS.approve}
        </Button>
      );
    }

    if (actionId === "hold") {
      return (
        <Button
          key={actionId}
          variant={variantClass}
          onClick={() => onAction("hold", { reason: HOLD_DEFAULT_REASON })}
        >
          {ACTION_LABELS.hold}
        </Button>
      );
    }

    if (actionId === "contact_supplier") {
      if (emailButtonState === "draft-open") {
        return (
          <Button
            key={actionId}
            variant="outline"
            className="text-muted-foreground transition-all duration-100"
            onClick={() => onAction("contact_supplier")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email draft open…
          </Button>
        );
      }
      if (emailButtonState === "sent") {
        return (
          <Button
            key={actionId}
            variant="outline"
            disabled
            className="text-muted-foreground transition-all duration-100"
          >
            <Check className="mr-2 h-4 w-4" />
            Email sent
          </Button>
        );
      }
      return (
        <Button
          key={actionId}
          variant={variantClass}
          disabled={drafting}
          onClick={handleContact}
          className={cn(
            "transition-all duration-100",
            primary &&
              "bg-primary dark:text-gray-900 hover:bg-primary/90 border-0",
          )}
        >
          {drafting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Drafting…
            </>
          ) : (
            ACTION_LABELS.contact_supplier
          )}
        </Button>
      );
    }

    if (actionId === "reject") {
      return (
        <Dialog key={actionId} open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button variant={variantClass}>{ACTION_LABELS.reject}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject invoice</DialogTitle>
              <DialogDescription>
                {id} · {vendor} · {amount}
                <br />
                This will notify the vendor and update the invoice status to
                rejected.
              </DialogDescription>
            </DialogHeader>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Reason for rejection
              </p>
              <div className="flex flex-wrap gap-2">
                {REJECT_REASONS.map((r) => (
                  <Button
                    key={r}
                    type="button"
                    variant={rejectReason === r ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRejectReason(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Add a note for the vendor (optional)…"
                rows={2}
                className="text-sm mt-3"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRejectSubmit}
              >
                Reject invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    // flag — outlined button opening the reason dialog. Picking "Escalating to
    // manager" additionally posts the Slack escalation card (see handleFlag).
    return (
      <Dialog key={actionId} open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            {ACTION_LABELS.flag}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flag for follow-up</DialogTitle>
            <DialogDescription>
              Park this invoice with a reason. It stays in your queue until
              resolved. "Escalating to manager" also posts to #ap-exceptions.
            </DialogDescription>
          </DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Reason</p>
            <div className="flex flex-wrap gap-2">
              {FLAG_REASONS.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={flagReason === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlagReason(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Add a note (optional)…"
              rows={3}
              className="text-sm mt-3"
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlagOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleFlagSubmit}>
              Flag invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div>
      {!confirmed && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((actionId, i) => renderAction(actionId, i === 0))}
        </div>
      )}

      {confirmed && (
        <Alert
          status="warning"
          visual="tinted"
          className="mt-3 bg-warning/30 dark:bg-warning/30"
        >
          {confirmed.kind === "hold" ? (
            <Clock className="h-4 w-4" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
          <div className="col-start-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium leading-none tracking-tight">
                {confirmed.kind === "hold" ? "On hold" : "Flagged"} ·{" "}
                {confirmed.reason}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {confirmed.kind === "hold"
                  ? "Paused pending resolution. Activity updated."
                  : "Parked in your queue. Activity updated."}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUndo(confirmed.kind)}
              className="shrink-0"
            >
              Undo
            </Button>
          </div>
        </Alert>
      )}
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
  emailButtonState = "default",
  onAction,
  onUndo,
  confirmed,
  dimContent = false,
  hideActions = false,
}: {
  emailButtonState?: "default" | "draft-open" | "sent";
  onAction: (id: ActionId, opts?: { reason?: string; note?: string }) => void;
  onUndo: (kind: "flag" | "hold") => void;
  confirmed: { kind: "flag" | "hold"; reason: string } | null;
  dimContent?: boolean;
  hideActions?: boolean;
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
      <div className="flex items-center gap-2 mb-4">
        <Badge
          status={exceptionTagStatus}
          variant="secondary"
          className="rounded-[4px] px-2.5 py-[3px]"
        >
          {exceptionTag}
        </Badge>
      </div>
      <div className={cn(dimContent && "opacity-60 pointer-events-none")}>
        <h2
          className="font-bold leading-[1.2] tracking-tight text-foreground w-full mb-4 overflow-hidden line-clamp-2"
          style={{
            fontSize: exceptionHeadline.length > 50 ? "28px" : "32px",
            textWrap: "balance",
            maxWidth: "22ch",
          }}
        >
          {exceptionHeadline}
        </h2>
        <div className="grid grid-cols-3 divide-x divide-border rounded-[6px] max-w-[480px] mb-4 [&>div:first-child]:pl-0">
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
        <p className="text-[14px] text-muted-foreground leading-[1.7] max-w-[540px] mb-6">
          {exceptionBody}
        </p>
      </div>
      {!hideActions && (
        <ActionBlock
          emailButtonState={emailButtonState}
          onAction={onAction}
          onUndo={onUndo}
          confirmed={confirmed}
        />
      )}
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
      suggestion: "Escalate or reject. Payment is overdue.",
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
        i === 0 ? `Supplier contacted: ${e.to}` : `Follow-up sent: ${e.to}`,
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
              {" · "}
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
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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

function LinesTab() {
  const { lines, linesTotal, linesAlert } = useInvoiceDetail();
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="px-5 pt-5 pb-8">
        <p className="text-[11px] text-muted-foreground mb-3">
          {lines.length} item{lines.length !== 1 ? "s" : ""} · Extracted from
          PDF
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-medium text-muted-foreground pb-2 pr-3 w-full">
                Description
              </th>
              <th className="text-right font-medium text-muted-foreground pb-2 px-3 whitespace-nowrap">
                Qty
              </th>
              <th className="text-right font-medium text-muted-foreground pb-2 px-3 whitespace-nowrap">
                Unit price
              </th>
              <th className="text-right font-medium text-muted-foreground pb-2 pl-3 whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-b border-border/50 group">
                <td className="py-3 pr-3 align-top">
                  <span className="text-foreground">{line.description}</span>
                  {line.flag && (
                    <Badge
                      variant="secondary"
                      status={line.flagStatus}
                      className="ml-2 text-[10px] align-middle"
                    >
                      {line.flag}
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-3 text-right text-muted-foreground tabular-nums align-top">
                  {line.qty}
                </td>
                <td className="py-3 px-3 text-right text-muted-foreground tabular-nums align-top">
                  {line.unitPrice ?? "—"}
                </td>
                <td
                  className={cn(
                    "py-3 pl-3 text-right tabular-nums align-top font-medium",
                    line.flagStatus === "error" && "text-destructive",
                    line.flagStatus === "warning" && "text-warning",
                  )}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {line.amount}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                className="pt-3 text-right text-muted-foreground pr-3"
              >
                Subtotal
              </td>
              <td
                className="pt-3 text-right pl-3 tabular-nums font-medium"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {linesTotal}
              </td>
            </tr>
            <tr>
              <td
                colSpan={3}
                className="py-1 text-right text-muted-foreground pr-3"
              >
                Tax
              </td>
              <td
                className="py-1 text-right pl-3 tabular-nums text-muted-foreground"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                —
              </td>
            </tr>
            <tr className="border-t border-border">
              <td colSpan={3} className="pt-3 text-right font-semibold pr-3">
                Total
              </td>
              <td
                className="pt-3 text-right pl-3 tabular-nums font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {linesTotal}
              </td>
            </tr>
          </tfoot>
        </table>
        {linesAlert && (
          <div className="mt-4">
            <Alert status={linesAlert.status} visual="outline">
              <AlertTitle>{linesAlert.text}</AlertTitle>
            </Alert>
          </div>
        )}
      </div>
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
              {
                label: "PO Number",
                value: po,
                danger: !po || po === "—" || /missing|not found/i.test(po),
              },
              { label: "Payment Terms", value: paymentTerms },
            ].map(({ label, value, danger }) => (
              <div key={label}>
                <div className="text-[8px] text-gray-400 mb-0.5">{label}</div>
                <div
                  className={cn(
                    "font-medium text-[10px]",
                    danger && "text-[#C0392B]",
                  )}
                >
                  {danger && !value ? "Not found" : value}
                </div>
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

function DetailsCombinedTab() {
  const d = useInvoiceDetail();
  const runtime = useInvoiceRuntime();
  // Reflect a data-changing resolution (e.g. Link PO-5123) on the shared record.
  const patchedPo = runtime.getRuntime(d.id).dataPatch?.purchaseOrder ?? d.po;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar [mask-image:linear-gradient(to_bottom,transparent_0,black_24px,black_calc(100%_-_64px),transparent_100%)]">
      <div className="px-5 pt-5 pb-16 space-y-0">
        {/* Section A — metadata */}
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Invoice
        </p>
        <div className="flex justify-between items-baseline py-1">
          <span className="text-xs text-muted-foreground">Document date</span>
          <span className="text-xs font-medium text-right">
            {d.documentDateFormatted}
          </span>
        </div>
        <div className="flex justify-between items-baseline py-1">
          <span className="text-xs text-muted-foreground">Due date</span>
          <span className="text-xs font-medium text-right">
            {d.dueFormatted}
          </span>
        </div>
        <div className="flex justify-between items-baseline py-1">
          <span className="text-xs text-muted-foreground">Payment terms</span>
          <span className="text-xs font-medium text-right">
            {d.paymentTerms}
          </span>
        </div>

        <Separator className="my-3" />

        <p className="text-xs font-medium text-muted-foreground mb-1">
          Parties
        </p>
        <div className="flex justify-between items-start py-1">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            Vendor
          </span>
          <div className="text-right ml-2">
            <div className="text-xs font-medium">{d.vendor}</div>
            {d.vendorEmail && (
              <div className="text-xs text-muted-foreground">
                {d.vendorEmail}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-baseline py-1">
          <span className="text-xs text-muted-foreground">Purchase order</span>
          <span className="text-xs font-medium text-right">{patchedPo}</span>
        </div>
        <div className="flex justify-between items-start py-1">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            Bill to
          </span>
          <div className="text-right ml-2">
            <div className="text-xs font-medium">{d.billTo}</div>
            {d.billAddress && (
              <div className="text-xs text-muted-foreground">
                {d.billAddress}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-3" />

        <p className="text-xs font-medium text-muted-foreground mb-1">
          Reference
        </p>
        <div className="flex justify-between items-baseline py-1">
          <span className="text-xs text-muted-foreground">Currency</span>
          <span className="text-xs font-medium text-right">{d.currency}</span>
        </div>
        <div className="flex justify-between items-baseline py-1">
          <span className="text-xs text-muted-foreground">Assignee</span>
          <span className="text-xs font-medium text-right">{d.assignee}</span>
        </div>
        {d.vat !== "—" && (
          <div className="flex justify-between items-baseline py-1">
            <span className="text-xs text-muted-foreground">VAT number</span>
            <span className="text-xs font-medium text-right">{d.vat}</span>
          </div>
        )}

        <Separator className="my-3" />

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
                    <Badge variant="secondary" className="shrink-0">
                      {line.flag}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                  <span>Qty {line.qty}</span>
                  <span className="text-foreground">{line.amount}</span>
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

// ── Timeline shared types ──────────────────────────────────────────────────────

type TimelineEntry = {
  id: string;
  label: string;
  time?: string;
  desc?: string;
  indicator: "pending" | "user" | "ai-warn" | "ai-pass";
  noteContent?: string;
  kind?: "flag" | "hold" | "note";
};

const FLAG_REASONS = [
  "Awaiting supplier response",
  "Escalating to manager",
  "PO in progress",
  "Needs more info",
] as const;
type FlagReason = (typeof FLAG_REASONS)[number];

const REJECT_REASONS = [
  "Incorrect price",
  "Wrong vendor",
  "Duplicate invoice",
  "No PO found",
  "Other",
] as const;
type RejectReason = (typeof REJECT_REASONS)[number];

type CompletionRecord = {
  type: "approved" | "rejected";
  reason?: string;
  time: string;
  by: string;
};

// A "parked" state — Flag (escalate) or Hold (pause). Lifted to the queue so
// the left-panel card reflects it, like approved/rejected.
type ParkedState = { kind: "flag" | "hold"; reason: string };

// ── ActivityTabC ───────────────────────────────────────────────────────────────

function ActivityTabC({
  extraEntries = [],
  onAddNote,
}: {
  extraEntries?: TimelineEntry[];
  onAddNote: (note: string) => void;
}) {
  const [noteState, setNoteState] = useState<"default" | "input">("default");
  const [noteText, setNoteText] = useState("");
  const prevExtraRef = useRef<TimelineEntry[]>([]);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prevIds = new Set(prevExtraRef.current.map((e) => e.id));
    const added = extraEntries
      .filter((e) => !prevIds.has(e.id))
      .map((e) => e.id);
    if (added.length > 0) setNewEntryIds(new Set(added));
    prevExtraRef.current = extraEntries;
  }, [extraEntries]);

  const staticItems: TimelineEntry[] = [
    { id: "static-0", label: "Awaiting decision", indicator: "pending" },
    {
      id: "static-1",
      label: "Assigned",
      time: "9:14 AM",
      desc: "Peter Vachon",
      indicator: "user",
    },
    {
      id: "static-2",
      label: "Agent escalated",
      time: "9:12 AM",
      desc: "Flagged for manual review",
      indicator: "ai-warn",
    },
    {
      id: "static-3",
      label: "Agent reviewed",
      time: "9:10 AM",
      desc: "PO matched, terms verified",
      indicator: "ai-pass",
    },
    {
      id: "static-4",
      label: "Data extracted",
      time: "9:08 AM",
      desc: "Invoice parsed successfully",
      indicator: "ai-pass",
    },
  ];

  const allItems = [...extraEntries, ...staticItems];

  function renderDot(indicator: TimelineEntry["indicator"]) {
    if (indicator === "pending")
      return (
        <div className="size-4 rounded-full border border-dashed border-muted-foreground/40 shrink-0" />
      );
    if (indicator === "user")
      return (
        <Avatar className="size-4 shrink-0">
          <AvatarImage src={REVIEWER_AVATAR} alt={REVIEWER_NAME} />
          <AvatarFallback className="text-[7px] font-bold text-white bg-muted-foreground">
            {REVIEWER_INITIALS}
          </AvatarFallback>
        </Avatar>
      );
    if (indicator === "ai-warn")
      return (
        <div className="size-4 rounded-full bg-amber-500/20 border border-amber-500/40 shrink-0 flex items-center justify-center">
          <Sparkle
            className="size-2 text-amber-500"
            fill="currentColor"
            strokeWidth={0}
          />
        </div>
      );
    return (
      <div className="size-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 shrink-0 flex items-center justify-center">
        <Sparkle
          className="size-2 text-emerald-500"
          fill="currentColor"
          strokeWidth={0}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="pl-5 pr-8 pt-5 pb-3 flex-1">
        {allItems.map((item, i) => {
          const isLast = i === allItems.length - 1;
          return (
            <div
              key={item.id}
              className={cn(
                "flex gap-3",
                newEntryIds.has(item.id) && "entry-new",
              )}
              onAnimationEnd={() =>
                setNewEntryIds((prev) => {
                  const next = new Set(prev);
                  next.delete(item.id);
                  return next;
                })
              }
            >
              <div className="flex flex-col items-center w-4 shrink-0">
                {renderDot(item.indicator)}
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
                    {/* Slack-sourced entries: split the label at the word
                        "Slack" so the brand mark sits immediately before it
                        — reinforces the source inline rather than trailing
                        the whole title. */}
                    {item.label.includes("Slack") ? (
                      <>
                        {item.label.slice(0, item.label.indexOf("Slack"))}
                        <SlackBrandIcon className="inline-block ml-1 mr-1 align-text-bottom" />
                        {item.label.slice(item.label.indexOf("Slack"))}
                      </>
                    ) : (
                      item.label
                    )}
                  </p>
                  {item.time && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {item.time}
                    </span>
                  )}
                </div>
                {item.noteContent ? (
                  <div className="mt-1 pl-2 border-l-2 border-border bg-muted rounded-sm p-2">
                    <p className="text-sm text-muted-foreground italic">
                      {item.noteContent}
                    </p>
                  </div>
                ) : item.desc ? (
                  <p className="text-[12px] text-muted-foreground leading-[1.5] mt-1">
                    {item.desc}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pl-5 pr-8 pb-4 shrink-0">
        <Separator className="mb-1" />
        {noteState === "input" ? (
          <div className="flex gap-2.5 px-3 py-2 items-start">
            <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
              <AvatarImage src={REVIEWER_AVATAR} alt={REVIEWER_NAME} />
              <AvatarFallback
                className="bg-gradient-to-br from-[#7C6AF5] to-[#5B8EF0] text-white font-semibold"
                style={{ fontSize: "9px" }}
              >
                {REVIEWER_INITIALS}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col gap-1.5">
              <Textarea
                placeholder="Add a note to this invoice…"
                className="text-xs min-h-[72px] resize-none"
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNoteState("default");
                    setNoteText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={!noteText.trim()}
                  onClick={() => {
                    if (noteText.trim()) onAddNote(noteText.trim());
                    setNoteState("default");
                    setNoteText("");
                  }}
                >
                  Save note
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer group"
            onClick={() => setNoteState("input")}
          >
            <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center flex-shrink-0 group-hover:border-muted-foreground transition-colors">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Add a note…
            </span>
          </div>
        )}
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
            className="text-[11px] font-medium text-muted-foreground bg-transparent border border-border rounded-[4px] hover:bg-accent hover:text-accent-foreground transition-colors leading-none cursor-pointer"
            style={{ padding: "3px 10px" }}
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

function EmailPanelTab({
  onSend,
  onDiscard,
}: {
  onSend: (email: SentEmail) => void;
  onDiscard: () => void;
}) {
  const data = useInvoiceDetail();
  const [to, setTo] = useState(data.vendorEmail);
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(
    `Invoice correction request: Invoice ${data.id}`,
  );
  const [body, setBody] = useState(() => generateDraftBody(data));
  const [sendPhase, setSendPhase] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 420);
    return () => clearTimeout(t);
  }, []);

  function handleSendClick() {
    setSendPhase("sending");
    setTimeout(() => {
      setSendPhase("sent");
      setTimeout(() => {
        onSend({ to, cc, subject, body, sentAt: "just now" });
      }, 600);
    }, 600);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header skeleton */}
        <div className="px-4 pt-4 pb-3 shrink-0">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Separator />

        {/* Fields skeleton */}
        <div className="px-4 py-2.5 shrink-0 space-y-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8 shrink-0" />
            <Skeleton className="h-6 flex-1 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12 shrink-0" />
            <Skeleton className="h-6 flex-1 rounded-md" />
          </div>
        </div>

        {/* AI rewrite skeleton */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 bg-muted/20">
          <Skeleton className="h-3 w-3 rounded-full shrink-0" />
          <Skeleton className="h-3 w-14 shrink-0" />
          {[48, 40, 36, 36].map((w, i) => (
            <Skeleton
              key={i}
              className={`h-5 w-${w === 48 ? "20" : w === 40 ? "16" : "14"} rounded-full shrink-0`}
            />
          ))}
        </div>

        {/* Body skeleton */}
        <div className="flex-1 p-3">
          <div className="w-full h-full rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        {/* Footer skeleton */}
        <div
          className="flex items-center justify-end gap-2 px-4 shrink-0"
          style={{ height: "80px" }}
        >
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    // Change 1: 1px gradient border wrapping the entire email content area
    <div
      className="flex flex-col h-full animate-in fade-in duration-180"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(262 83% 58% / 0.20))",
        padding: "1px",
      }}
    >
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ background: "hsl(var(--card))" }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 shrink-0">
          <p className="text-sm font-semibold">Email to {data.vendor}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-filled from invoice data. Review before sending.
          </p>
        </div>
        <Separator />

        {/* Fields */}
        <div className="px-4 py-2.5 shrink-0 space-y-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">
              To
            </span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-muted/30 rounded-md px-2 py-1 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">
                CC
              </span>
              <input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Add CC…"
                className="flex-1 bg-muted/30 rounded-md px-2 py-1 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40 min-w-0"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">
              Subject
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-muted/30 rounded-md px-2 py-1 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
            />
          </div>
        </div>

        {/* AI rewrite — Change 3: icon only (text-primary), no label text */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border shrink-0 flex-wrap bg-muted/20">
          <Sparkle className="size-3 text-primary shrink-0" />
          {AI_REWRITES.map((action) => (
            <button
              key={action}
              type="button"
              className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Body — Change 4: gradient wrapper gives top edge a faint teal wash */}
        <div className="flex-1 overflow-hidden p-3">
          <div
            className="w-full h-full rounded-lg p-px"
            style={{
              background:
                "linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, transparent 40%)",
            }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-full resize-none bg-card rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring custom-scrollbar"
            />
          </div>
        </div>

        {/* Footer — height matches AskFooter's below-chips section (16+50+14=80px) */}
        <div
          className="flex items-center justify-end gap-2 px-4 shrink-0"
          style={{ height: "80px" }}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={sendPhase !== "idle"}
            onClick={onDiscard}
          >
            Discard
          </Button>
          <Button
            variant={sendPhase === "sent" ? "success" : "default"}
            size="sm"
            disabled={sendPhase !== "idle"}
            onClick={handleSendClick}
          >
            {sendPhase === "idle" && <Send className="size-3.5" />}
            {sendPhase === "sending" && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            {sendPhase === "sent" && <Check className="size-3.5" />}
            {sendPhase === "idle" && "Send Email"}
            {sendPhase === "sending" && "Sending…"}
            {sendPhase === "sent" && "Sent!"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type CenterView = "findings" | "comms";

function CenterToggle({
  view,
  onViewChange,
  commsUnread,
  commsCount,
}: {
  view: CenterView;
  onViewChange: (v: CenterView) => void;
  commsUnread: number;
  commsCount: number;
}) {
  // Activity lives in the right panel, so the center toggle is Exception + Comms.
  const views: { id: CenterView; label: string }[] = [
    { id: "findings", label: "Exception" },
    { id: "comms", label: "Comms" },
  ];
  const ids = views.map((v) => v.id);

  function handleKeyDown(e: React.KeyboardEvent, current: CenterView) {
    const idx = ids.indexOf(current);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onViewChange(ids[(idx + 1) % ids.length]);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onViewChange(ids[(idx - 1 + ids.length) % ids.length]);
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Center view"
      className="shrink-0 flex items-center border-b border-border"
    >
      {views.map((v) => {
        const isActive = view === v.id;
        const isFindings = v.id === "findings";
        return (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onViewChange(v.id)}
            onKeyDown={(e) => handleKeyDown(e, v.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-5 py-3 text-xs whitespace-nowrap transition-colors focus-visible:outline-none",
              isFindings
                ? "font-bold"
                : isActive
                  ? "font-medium text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {isFindings ? (
              <AutopilotGradientIcon size={14} />
            ) : v.id === "comms" ? (
              <MessageSquare className="size-3" />
            ) : (
              <Clock className="size-3" />
            )}
            {isFindings ? (
              <span className="findings-ai-gradient bg-clip-text text-transparent">
                {v.label}
              </span>
            ) : (
              v.label
            )}
            {v.id === "comms" && commsCount > 0 && (
              <span
                className={cn(
                  "rounded-full",
                  commsUnread > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
                style={{
                  fontSize: "9px",
                  fontWeight: 500,
                  padding: "1px 5px",
                }}
                aria-label={
                  commsUnread > 0
                    ? `${commsCount} messages, ${commsUnread} unread`
                    : `${commsCount} messages`
                }
              >
                {commsCount > 9 ? "9+" : commsCount}
              </span>
            )}
            {isActive && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 right-0 -bottom-px h-[2px]",
                  isFindings ? "findings-ai-gradient" : "bg-foreground",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function CommsMessageRow({
  msg,
  onAction,
  canReply = false,
  onReplyClick,
  inCard = false,
}: {
  msg: CommsMessage;
  onAction: (id: ActionId) => void;
  canReply?: boolean;
  onReplyClick?: () => void;
  // When grouped inside a card, the channel label lives in the card header,
  // so hide it on the row to avoid repetition.
  inCard?: boolean;
}) {
  const isAgent = msg.from.type === "agent";
  const isCompany = !!msg.from.company;
  const isRich = msg.source === "slack" && msg.subtype === "rich_block";
  return (
    <div className="flex gap-3">
      {isAgent ? (
        <div
          className="size-7 rounded-full shrink-0 flex items-center justify-center bg-info/15 text-info mt-0.5"
          aria-hidden="true"
        >
          <Sparkles className="size-3.5" />
        </div>
      ) : isCompany ? (
        <div
          className="size-7 rounded-[6px] shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
          style={{ background: avatarBg(msg.from.name) }}
          title={msg.from.name}
          aria-hidden="true"
        >
          {msg.from.initials}
        </div>
      ) : (
        <Avatar className="size-7 shrink-0 mt-0.5">
          <AvatarImage src={msg.from.avatarUrl} alt={msg.from.name} />
          <AvatarFallback
            className="text-white text-[10px] font-semibold"
            style={{ background: avatarBg(msg.from.name) }}
          >
            {msg.from.initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0">
        {/* items-center across the row: with mixed text sizes (12px name vs
            10px label + timestamp) and a 12px icon, baseline alignment leaves
            the name visually high. Centering the row reads cleanly. */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold">{msg.from.name}</span>
          {!inCard && (
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              {msg.source === "email" ? (
                <>
                  <Mail className="size-3" />
                  {msg.direction === "outbound" ? "to " : ""}
                  {msg.toOrChannel}
                </>
              ) : (
                <>
                  <SlackBrandIcon className="size-3" />
                  {msg.toOrChannel}
                </>
              )}
            </span>
          )}
          {msg.source === "email" && msg.direction === "outbound" && (
            <span className="text-[9px] font-medium uppercase tracking-wide rounded-full bg-muted text-muted-foreground px-1.5 py-px">
              sent
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {msg.timestamp}
          </span>
        </div>
        {isRich ? (
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {msg.body}
            </p>
            {msg.contextBlocks?.map((block, bi) => (
              <div
                key={bi}
                className="rounded-md border border-border bg-background overflow-hidden"
              >
                <div className="px-3 py-1.5 border-b border-border bg-muted/40 text-[10px] font-medium text-muted-foreground">
                  {block.title}
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row.label}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-1.5 text-right font-medium tabular-nums",
                            row.accent === "error" && "text-destructive",
                            row.accent === "warning" && "text-warning",
                          )}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {msg.actions.map((action) => (
                  <Button
                    key={action.actionId}
                    size="sm"
                    variant={
                      action.variant === "primary" ? "default" : "outline"
                    }
                    onClick={() => onAction(action.actionId)}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {msg.body}
          </p>
        )}
        {msg.attachments?.map((att) => (
          <span
            key={att.name}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground"
          >
            📎 {att.name}
            <span className="text-muted-foreground/60">· {att.size}</span>
          </span>
        ))}
        {/* Per-message Reply is hidden inside grouped cards — the card owns
            one reply input at the bottom, since the card IS the thread. */}
        {canReply && !inCard && (
          <button
            type="button"
            onClick={onReplyClick}
            className="mt-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

function CommsView({
  messages,
  onNewEmail,
  onAction,
  onSendReply,
  hasActiveThread,
}: {
  messages: CommsMessage[];
  onNewEmail: () => void;
  onAction: (id: ActionId) => void;
  onSendReply: (text: string) => void;
  hasActiveThread: boolean;
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [reply, setReply] = useState("");
  // Which message has its inline reply input open. Only one at a time.
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const hasEmail = messages.some((m) => m.source === "email");
  const hasSlack = messages.some((m) => m.source === "slack");

  function startReply(id: string) {
    setReplyingTo(id);
    setReply("");
  }
  function cancelReply() {
    setReplyingTo(null);
    setReply("");
  }
  function sendReply() {
    const text = reply.trim();
    if (!text) return;
    onSendReply(text);
    setReplyingTo(null);
    setReply("");
  }
  const composition =
    hasEmail && hasSlack
      ? "email + Slack"
      : hasEmail
        ? "email only"
        : hasSlack
          ? "Slack only"
          : "";

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-3 px-5 py-3">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">Comms</span>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
              {composition && ` · ${composition}`}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSummaryOpen((v) => !v)}
          disabled={messages.length === 0}
          className="gap-1.5 h-7 text-xs"
        >
          <AutopilotGradientIcon size={12} />
          Summarize
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onNewEmail}
          className="gap-1.5 h-7 text-xs"
        >
          <Mail className="size-3" />
          New email
        </Button>
      </div>
      <div className="relative flex-1 overflow-y-auto custom-scrollbar px-5 pt-2 pb-4 space-y-4">
        {summaryOpen && (
          <div className="relative">
            {/* Subtle ambient AI-gradient glow behind the card */}
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-xl opacity-20 blur-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(97.73deg, #6C5AEF 8.79%, #69C7DD 91.48%)",
              }}
            />
            <div className="relative rounded-lg bg-background px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    AI Summary
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    ACME submitted INV-GRN-001 with a $4.84 price overage vs.
                    the agreed PO. The agent flagged it in #ap-exceptions and
                    Peter emailed the vendor requesting a corrected invoice.
                    Awaiting vendor response.
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Regenerate summary"
                    className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RefreshCw className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Dismiss summary"
                    onClick={() => setSummaryOpen(false)}
                    className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {(() => {
          // Group messages into thread cards: all Slack messages collapse
          // into the one escalation thread (the only Slack thread per
          // invoice in v1); each email is its own card since we have no
          // email thread linkage. Order: groups appear in the order their
          // first message arrived.
          const groups: Array<{
            key: string;
            source: "slack" | "email";
            channel: string;
            messages: CommsMessage[];
          }> = [];
          for (const msg of messages) {
            const key =
              msg.source === "slack" ? "slack-thread" : `email-${msg.id}`;
            const existing = groups.find((g) => g.key === key);
            if (existing) {
              existing.messages.push(msg);
            } else {
              groups.push({
                key,
                source: msg.source,
                channel: msg.toOrChannel,
                messages: [msg],
              });
            }
          }
          return groups.map((group) => {
            const isSlackGroup = group.source === "slack";
            const isOutlookGroup =
              !isSlackGroup &&
              group.messages.some((m) => m.provider === "outlook");
            const groupCanReply = isSlackGroup && hasActiveThread;
            const groupReplyOpen = replyingTo === group.key;
            return (
              <Card key={group.key} variant="glass" className="overflow-hidden">
                {/* Channel header — icon + channel name, once per card. */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 text-[11px] text-muted-foreground">
                  {isSlackGroup ? (
                    <SlackBrandIcon className="size-3" />
                  ) : isOutlookGroup ? (
                    <OutlookBrandIcon className="size-3.5" />
                  ) : (
                    <Mail className="size-3" />
                  )}
                  <span className="font-medium">{group.channel}</span>
                  {isOutlookGroup && (
                    <span className="text-muted-foreground/60">
                      · via Outlook
                    </span>
                  )}
                  <span className="text-muted-foreground/60">
                    · {group.messages.length} message
                    {group.messages.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <CardContent className="px-4 py-3 space-y-4">
                  {group.messages.map((msg, i) => (
                    <div key={msg.id}>
                      <CommsMessageRow msg={msg} onAction={onAction} inCard />
                      {i < group.messages.length - 1 && (
                        <div className="mt-4 border-t border-border/40" />
                      )}
                    </div>
                  ))}
                </CardContent>
                {groupCanReply && (
                  <div className="px-4 pb-3">
                    {groupReplyOpen ? (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Reply to thread…"
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              sendReply();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelReply();
                            }
                          }}
                          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none min-w-0"
                        />
                        <button
                          type="button"
                          onClick={cancelReply}
                          className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          aria-label="Send reply"
                          disabled={!reply.trim()}
                          onClick={sendReply}
                          className="size-7 rounded-md flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startReply(group.key)}
                        className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Reply in thread
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          });
        })()}
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pb-16">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquareOff className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No messages yet
            </p>
            <p className="mt-1.5 max-w-[260px] text-xs text-muted-foreground leading-relaxed">
              Emails and Slack threads about this invoice will appear here. Use
              the agent's suggested actions to start a conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RightPanel({
  tab,
  onTabChange,
  commsIsNew,
  onCommsViewed,
  extraTimelineEntries,
  onAddNote,
  width,
  onWidthChange,
  mergedLayout = false,
}: {
  tab: RightTab;
  onTabChange: (tab: RightTab) => void;
  commsIsNew: boolean;
  onCommsViewed: () => void;
  extraTimelineEntries: TimelineEntry[];
  onAddNote: (note: string) => void;
  width: number;
  onWidthChange: (w: number) => void;
  mergedLayout?: boolean;
}) {
  const MIN_WIDTH = 360;
  const MAX_WIDTH = 720;

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    function move(ev: PointerEvent) {
      // Dragging the left edge: moving left widens, moving right narrows.
      const next = startWidth - (ev.clientX - startX);
      onWidthChange(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
    }
    function up() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Next layout: drop Activity (now in the timeline) and fold Line items into Details.
  const tabOrder: RightTab[] = mergedLayout
    ? ["details", "source"]
    : ["activity", "details", "lines", "source"];
  const effectiveTab: RightTab =
    mergedLayout && (tab === "activity" || tab === "lines") ? "details" : tab;
  const tabLabel = (t: RightTab) =>
    t === "lines" ? "Line items" : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div
      className={cn(
        "relative border-l border-border flex flex-col shrink-0 overflow-hidden h-full transition-colors duration-180",
      )}
      style={{ width: `${width}px` }}
    >
      {/* Drag handle on the left edge to resize the panel. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        onPointerDown={startResize}
        className="absolute left-0 top-0 z-20 h-full w-1.5 cursor-ew-resize hover:bg-primary/30 active:bg-primary/40 transition-colors"
      />
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
              "relative flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1 whitespace-nowrap",
              effectiveTab === t
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabLabel(t)}
            {t === "comms" && commsIsNew && (
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {effectiveTab === "activity" && (
          <ActivityTabC
            extraEntries={extraTimelineEntries}
            onAddNote={onAddNote}
          />
        )}
        {/* DetailsCombinedTab already combines fields + a Line items section,
            so the merged tab is just this (no separate LinesTab = no overlap). */}
        {effectiveTab === "details" && <DetailsCombinedTab />}
        {effectiveTab === "lines" && <LinesTab />}
        {effectiveTab === "source" && <SourceTab />}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

// Mirror of a per-invoice entry in the Slack listener's shared store.
type IngestedMessage = {
  id: string;
  source: "slack";
  subtype: "plain";
  from: { name: string; initials: string; type: "human"; avatarUrl?: string };
  toOrChannel: string;
  timestamp: string; // ISO
  body: string;
  external_id: string;
};

type SlackResolution = {
  status: string;
  action: "approve" | "hold" | "reject" | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_via: string | null;
  messages?: IngestedMessage[];
};

// Format an ISO timestamp (from ingested Slack replies) like the seed comms.
function formatCommsTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Center + right panel content only — no LeftNav wrapper. */
// --- Dev "next" version stubs (toggled via the profile menu, see
// invoice-version.tsx). Header and right panel mirror the current components so
// switching is a no-op until we diverge; the center starts as a blank canvas.
// Lean next-version header: identity (invoice # + vendor) + Status + the
// Approve split-button, inline on one row. Amount/Due/PO/Assignee are dropped
// here because the Details panel already owns them.
function TopBarNext({
  flagged,
  held,
  completion,
  canApprove,
  onApprove,
  onReject,
  onHold,
  onFlag,
}: {
  flagged: boolean;
  held?: boolean;
  completion?: CompletionRecord;
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
  onHold: () => void;
  onFlag: () => void;
}) {
  const d = useInvoiceDetail();
  const runtime = useInvoiceRuntime();
  // A data-changing resolution (e.g. Link PO-5123) patches the shared record.
  const patchedPo = runtime.getRuntime(d.id).dataPatch?.purchaseOrder ?? d.po;
  // A routed exception waiting on an outside reply blocks Approve.
  const waitingOn = runtime.getRuntime(d.id).waiting[0]?.waitingOn ?? null;
  const tableRow = invoiceTableData.find((r) => r.id === d.id);
  const baseStatus: InvoiceStatus = tableRow?.status ?? "pending-review";
  const effectiveStatus: InvoiceStatus = completion
    ? completion.type === "approved"
      ? "approved"
      : "rejected"
    : held
      ? "on-hold"
      : flagged
        ? "flagged"
        : baseStatus;
  const statusInfo = statusBadgeMap[effectiveStatus];
  return (
    <PageHeader bordered className="@3xl:!grid-cols-[auto_1fr_auto]">
      <PageHeaderNav>
        <PageHeaderTitleGroup>
          <PageHeaderTitle as="h2">
            <span className="group inline-flex items-center gap-1 cursor-pointer">
              <span className="group-hover:underline">{d.id}</span>
              <ExternalLink className="size-3.5 shrink-0 text-foreground opacity-0 -translate-x-1 transition-all duration-120 group-hover:opacity-60 group-hover:translate-x-0" />
            </span>
          </PageHeaderTitle>
          <PageHeaderDescription>{d.vendor}</PageHeaderDescription>
        </PageHeaderTitleGroup>
      </PageHeaderNav>
      <PageHeaderContent className="@3xl:justify-between">
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
          <PageHeaderFieldValue>
            {!patchedPo || patchedPo === "—" ? (
              <Badge status="error" variant="secondary">
                Missing PO
              </Badge>
            ) : (
              patchedPo
            )}
          </PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
          <PageHeaderFieldValue className="flex items-center gap-1 transition-colors duration-180">
            <Badge status={statusInfo.status} variant="secondary">
              {statusInfo.label}
            </Badge>
          </PageHeaderFieldValue>
        </PageHeaderField>
        <PageHeaderField>
          <PageHeaderFieldLabel>Assignee</PageHeaderFieldLabel>
          <PageHeaderFieldValue className="flex items-center gap-1.5">
            <Avatar className="size-[14px] shrink-0">
              {d.assignee === REVIEWER_NAME && (
                <AvatarImage src={REVIEWER_AVATAR} alt={d.assignee} />
              )}
              <AvatarFallback className="text-[7px] font-bold text-background bg-muted-foreground">
                {d.assigneeInitials[0]}
              </AvatarFallback>
            </Avatar>
            {d.assignee}
          </PageHeaderFieldValue>
        </PageHeaderField>
      </PageHeaderContent>
      <PageHeaderActions className="@3xl:ml-6">
        <HeaderDecision
          canApprove={canApprove}
          onApprove={onApprove}
          onReject={onReject}
          onHold={onHold}
          onFlag={onFlag}
          waitingOn={waitingOn}
        />
      </PageHeaderActions>
    </PageHeader>
  );
}

function RightPanelNext(props: Parameters<typeof RightPanel>[0]) {
  return <RightPanel {...props} mergedLayout />;
}

function CenterPanelNext({
  activeInvoiceId,
  onCleared,
  onApprove,
  onHold,
  exceptionListVariant,
}: {
  activeInvoiceId: string;
  onCleared: () => void;
  onApprove: () => void;
  onHold: () => void;
  exceptionListVariant?: "strip" | "index";
}) {
  const review = getReview(activeInvoiceId);
  // The timeline owns the resolve/revalidate loop; it calls onCleared once the
  // invoice fully clears. Keyed by invoice id so loop state resets on switch.
  // onApprove/onHold are the same handlers as the header disposition control.
  return (
    <ExceptionTimeline
      key={review.id}
      review={review}
      onAllClear={onCleared}
      onApprove={onApprove}
      onHold={onHold}
      exceptionListVariant={exceptionListVariant}
    />
  );
}

function InvoiceDetailPane({
  activeInvoiceId,
  completion,
  onComplete,
  onUndoComplete,
  nextInvoice,
  onNextInvoice,
  onBack,
  totalInQueue,
  completedCount,
  approvedCount,
  rejectedCount,
  rightTab,
  onRightTabChange,
  centerView,
  onCenterViewChange,
  commsUnread,
  commsCount,
  onCommsViewed,
  slackResolution,
  hasActiveThread,
  rightPanelWidth,
  onRightPanelWidthChange,
  confirmed,
  onPark,
  onUnpark,
  onContacted,
  sentEmails,
  onAddSentEmail,
  extraTimelineEntries,
  setExtraTimelineEntries,
}: {
  activeInvoiceId: string;
  completion?: CompletionRecord;
  onComplete: (type: "approved" | "rejected", reason?: string) => void;
  onUndoComplete: () => void;
  nextInvoice: Invoice | null;
  onNextInvoice: () => void;
  onBack: () => void;
  totalInQueue: number;
  completedCount: number;
  approvedCount: number;
  rejectedCount: number;
  rightTab: RightTab;
  onRightTabChange: (tab: RightTab) => void;
  centerView: CenterView;
  onCenterViewChange: (v: CenterView) => void;
  commsUnread: number;
  commsCount: number;
  onCommsViewed: () => void;
  slackResolution: SlackResolution | null;
  hasActiveThread: boolean;
  rightPanelWidth: number;
  onRightPanelWidthChange: (w: number) => void;
  confirmed: ParkedState | null;
  onPark: (kind: "flag" | "hold", reason: string) => void;
  onUnpark: () => void;
  onContacted: () => void;
  sentEmails: SentEmail[];
  onAddSentEmail: (email: SentEmail) => void;
  extraTimelineEntries: TimelineEntry[];
  setExtraTimelineEntries: (
    updater: (prev: TimelineEntry[]) => TimelineEntry[],
  ) => void;
}) {
  const { version } = useInvoiceVersion();
  // Header Approve stays locked until the timeline reports the path is clear.
  // Resets per invoice because InvoiceDetailPane is keyed by contentKey.
  const [approveReady, setApproveReady] = useState(false);
  const data =
    detailDataMap[activeInvoiceId] ??
    (detailDataMap["INV-GRN-001"] as InvoiceDetailData);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  // Sent emails are owned by the parent (keyed per invoice) so they persist
  // across invoice switches and feed into the Comms count badge.
  const [commsIsNew, setCommsIsNew] = useState(false);
  // Flag/Hold ("parked") state is owned by the parent (keyed per invoice) so it
  // persists across invoice switches and drives the queue card.
  const flagged = confirmed?.kind === "flag";
  const held = confirmed?.kind === "hold";
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  // Seed thread + thread replies ingested from Slack (polled via the store).
  const ingestedMessages: CommsMessage[] = (
    slackResolution?.messages ?? []
  ).map((m) => ({
    id: m.id,
    source: "slack",
    subtype: "plain",
    from: {
      name: m.from.name,
      initials: m.from.initials,
      type: "human",
      avatarUrl: m.from.avatarUrl,
    },
    toOrChannel: m.toOrChannel,
    timestamp: formatCommsTime(m.timestamp),
    body: m.body,
  }));
  // "Contact supplier" sends through Outlook — surface those emails in the
  // Comms feed as their own card per send. `direction: outbound` keeps the
  // existing "to ..." styling on the row.
  const sentEmailMessages: CommsMessage[] = sentEmails.map((e, i) => ({
    id: `sent-email-${i}-${e.sentAt}`,
    source: "email",
    provider: "outlook",
    subtype: "plain",
    from: {
      name: data.assignee,
      initials: data.assigneeInitials,
      type: "human",
      avatarUrl: data.assignee === REVIEWER_NAME ? REVIEWER_AVATAR : undefined,
    },
    toOrChannel: e.to,
    direction: "outbound",
    timestamp: e.sentAt,
    body: e.body,
  }));
  const commsMessages: CommsMessage[] = [
    ...(commsDataMap[activeInvoiceId] ?? []),
    ...ingestedMessages,
    ...sentEmailMessages,
  ];
  const [emailDraftKey, setEmailDraftKey] = useState(0);
  const [justCompleted, setJustCompleted] = useState<CompletionRecord | null>(
    null,
  );
  const approveEntryIdRef = useRef<string | null>(null);
  // Guards against re-applying the same Slack resolution on every poll tick.
  const appliedResolutionRef = useRef<string | null>(null);

  const nowTime = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  // Activity label carries the verb plus a "via Slack" suffix when the action
  // was taken from the Slack card — the audit trail captures the channel.
  const actionLabel = (verb: string, source: ActionSource) =>
    source === "slack" ? `${verb} via Slack` : verb;

  function handleApprove(source: ActionSource, by: string = data.assignee) {
    const time = nowTime();
    const record: CompletionRecord = {
      type: "approved",
      time,
      by,
    };
    const entryId = `approved-${Date.now()}`;
    approveEntryIdRef.current = entryId;
    // The confirmation alert + Up Next is for the moment you click in the
    // product. Slack-driven approvals just update status (no alert).
    if (source === "findings") setJustCompleted(record);
    onComplete("approved");
    setExtraTimelineEntries((prev) => [
      {
        id: entryId,
        label: actionLabel("Approved", source),
        time,
        desc: `By ${by}`,
        indicator: "user",
      },
      ...prev,
    ]);
    if (!nextInvoice) {
      toast.success("All caught up", {
        description: "No more invoices pending review.",
        duration: 4000,
      });
    } else {
      toast.success("Invoice approved", {
        description: `${data.id} · ${data.vendor}`,
        action: { label: "Undo", onClick: handleUndoApproval },
        duration: 5000,
      });
    }
  }

  function handleUndoApproval() {
    setJustCompleted(null);
    onUndoComplete();
    if (approveEntryIdRef.current) {
      const id = approveEntryIdRef.current;
      setExtraTimelineEntries((prev) => prev.filter((e) => e.id !== id));
      approveEntryIdRef.current = null;
    }
  }

  function handleReject(
    reason: string,
    source: ActionSource,
    by: string = data.assignee,
  ) {
    const time = nowTime();
    const record: CompletionRecord = {
      type: "rejected",
      reason,
      time,
      by,
    };
    if (source === "findings") setJustCompleted(record);
    onComplete("rejected", reason);
    setExtraTimelineEntries((prev) => [
      {
        id: `rejected-${Date.now()}`,
        label: actionLabel("Rejected", source),
        time,
        desc: `By ${by}`,
        indicator: "user",
      },
      ...prev,
    ]);
    toast.error("Invoice rejected", {
      description: `${data.id} · Reason: ${reason}`,
      duration: 5000,
    });
  }

  function handleHold(
    reason: string,
    source: ActionSource,
    by: string = data.assignee,
  ) {
    onPark("hold", reason);
    setExtraTimelineEntries((prev) => [
      {
        id: `hold-${Date.now()}`,
        label: actionLabel("Held for correction", source),
        time: nowTime(),
        desc: `By ${by}`,
        indicator: "user",
        kind: "hold",
      },
      ...prev,
    ]);
    toast("Invoice on hold", {
      description: reason,
      action: { label: "Undo", onClick: () => handleUndoState("hold") },
      duration: 5000,
    });
  }

  function openEmailModal() {
    setEmailModalOpen(true);
  }

  function closeEmailModal() {
    setEmailModalOpen(false);
  }

  function discardEmailDraft() {
    setEmailModalOpen(false);
    setEmailDraftKey((k) => k + 1);
  }

  function handleSend(email: SentEmail) {
    onAddSentEmail(email);
    setCommsIsNew(true);
    setEmailModalOpen(false);
    // Mark this invoice as "Contacted supplier" in the queue card so the
    // open action is visible without opening the invoice again.
    onContacted();
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    setExtraTimelineEntries((prev) => [
      {
        id: `email-${Date.now()}`,
        label: "Email sent",
        time,
        desc: `To ${email.to}`,
        indicator: "user",
      },
      ...prev,
    ]);
    toast.success("Email sent", { description: `To ${email.to}` });
  }

  function handleFlag(
    reason: string,
    source: ActionSource,
    by: string = data.assignee,
    note?: string,
  ) {
    // "Escalating to manager" also posts the escalation card to Slack.
    const isEscalation = reason === "Escalating to manager";
    onPark("flag", reason);
    setExtraTimelineEntries((prev) => [
      {
        id: `flag-${Date.now()}`,
        label: isEscalation
          ? "Escalated to manager via Slack"
          : actionLabel("Flagged for follow-up", source),
        time: nowTime(),
        desc: `By ${by}`,
        indicator: "user",
        kind: "flag",
      },
      ...prev,
    ]);
    if (isEscalation) postEscalationToSlack(by, note);
  }

  // Posts the agent escalation card to #ap-exceptions, attributing it to the
  // reviewer and attaching their optional note.
  async function postEscalationToSlack(by: string, note?: string) {
    let result: { ok?: boolean; error?: string } | undefined;
    try {
      const res = await fetch("/api/demo-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: data.id, by, note }),
      });
      result = await res.json();
    } catch {
      toast.error("Slack escalation failed", {
        description: "Is the Slack listener running? (cd slack && npm start)",
      });
      return;
    }
    if (!result?.ok) {
      toast.error("Slack escalation failed", { description: result?.error });
      return;
    }
    toast.success("Escalated to manager", {
      description: "Posted to #ap-exceptions",
    });
  }

  // Send a Comms reply back into the card's Slack thread. The ingested copy
  // surfaces in the feed on the next poll (~2s).
  async function handleSendReply(text: string) {
    let result: { ok?: boolean; error?: string } | undefined;
    try {
      const res = await fetch("/api/demo-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: data.id,
          text,
          posted_as: {
            name: data.assignee || REVIEWER_NAME,
            avatar_url: REVIEWER_AVATAR_PUBLIC,
          },
        }),
      });
      result = await res.json();
    } catch {
      toast.error("Reply failed", {
        description: "Is the Slack listener running? (cd slack && npm start)",
      });
      return;
    }
    if (!result?.ok) {
      toast.error("Reply failed", { description: result?.error });
    }
  }

  function handleUndoState(kind: "flag" | "hold") {
    onUnpark();
    setExtraTimelineEntries((prev) => prev.filter((e) => e.kind !== kind));
  }

  // Single canonical dispatch — every surface (Findings buttons, Slack card)
  // calls into this. Surfaces only choose which actions to show and how to
  // label them; the action taken and the audit-trail event are identical.
  function dispatchAction(
    id: ActionId,
    source: ActionSource,
    opts?: { reason?: string; by?: string; note?: string },
  ) {
    switch (id) {
      case "approve":
        handleApprove(source, opts?.by);
        break;
      case "hold":
        handleHold(opts?.reason ?? HOLD_DEFAULT_REASON, source, opts?.by);
        break;
      case "contact_supplier":
        openEmailModal();
        break;
      case "reject":
        handleReject(opts?.reason ?? "Incorrect price", source, opts?.by);
        break;
      case "flag":
        handleFlag(
          opts?.reason ?? "Awaiting supplier response",
          source,
          opts?.by,
          opts?.note,
        );
        break;
    }
  }

  // Apply a resolution that arrived from the Slack card (via the polled store).
  // Runs the same canonical action a Findings click would, attributed to the
  // Slack user and tagged "via Slack" in the Activity log.
  useEffect(() => {
    const r = slackResolution;
    if (!r || !r.action || !r.resolved_at) return;
    if (appliedResolutionRef.current === r.resolved_at) return;
    appliedResolutionRef.current = r.resolved_at;
    dispatchAction(r.action, "slack", { by: r.resolved_by ?? undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slackResolution?.resolved_at]);

  function handleAddNote(note: string) {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    setExtraTimelineEntries((prev) => [
      {
        id: `note-${Date.now()}`,
        label: "Note added",
        time,
        indicator: "user",
        noteContent: note,
        kind: "note",
      },
      ...prev,
    ]);
  }

  return (
    <InvoiceDetailContext.Provider value={data}>
      <>
        <div
          className="shrink-0 inv-between-enter"
          style={{ animationDelay: "40ms" }}
        >
          {version !== "v1" ? (
            <TopBarNext
              flagged={flagged}
              held={held}
              completion={justCompleted ?? completion}
              canApprove={approveReady}
              onApprove={() => onComplete("approved")}
              onReject={() => onComplete("rejected")}
              onHold={() => onPark("hold", "Held from header")}
              onFlag={() => onPark("flag", "Flagged from header")}
            />
          ) : (
            <TopBar
              flagged={flagged}
              held={held}
              completion={justCompleted ?? completion}
            />
          )}
        </div>
        <div
          className="relative flex flex-1 overflow-hidden"
          style={{ minWidth: "480px" }}
        >
          {/* Center workspace content */}
          <div
            className="flex flex-col flex-1 overflow-hidden inv-between-enter"
            style={{ animationDelay: "80ms" }}
          >
            {version !== "v1" ? (
              // v3 previews the "Up next" strip; v2 keeps the bordered index.
              <CenterPanelNext
                activeInvoiceId={activeInvoiceId}
                onCleared={() => setApproveReady(true)}
                onApprove={() => onComplete("approved")}
                onHold={() => onPark("hold", "Held from header")}
                exceptionListVariant={version === "v3" ? "strip" : "index"}
              />
            ) : (
              <>
                {/* Segmented toggle — Findings / Comms */}
                <CenterToggle
                  view={centerView}
                  onViewChange={(v) => {
                    onCenterViewChange(v);
                    if (v === "comms") onCommsViewed();
                  }}
                  commsUnread={commsUnread}
                  commsCount={commsCount}
                />
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Comms always shows the communication trail, even after the
                  invoice is approved/rejected/held. */}
                  {centerView === "comms" ? (
                    <CommsView
                      messages={commsMessages}
                      onNewEmail={openEmailModal}
                      onAction={(id) => dispatchAction(id, "slack")}
                      onSendReply={handleSendReply}
                      hasActiveThread={hasActiveThread}
                    />
                  ) : justCompleted && !nextInvoice ? (
                    /* Queue cleared — replaces center content entirely */
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col items-center text-center py-12 px-8">
                        <AnimatedCheck size={56} />
                        <div
                          className="mt-6 flex flex-col items-center gap-4"
                          style={{
                            opacity: 0,
                            animation: "fadeIn 300ms ease 600ms forwards",
                          }}
                        >
                          <div>
                            <h2 className="text-xl font-medium">
                              All caught up
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              No invoices pending your review.
                            </p>
                          </div>
                          {(approvedCount > 0 || rejectedCount > 0) && (
                            <div className="flex gap-2 flex-wrap justify-center">
                              {approvedCount > 0 && (
                                <Badge status="success" variant="secondary">
                                  {approvedCount} approved this session
                                </Badge>
                              )}
                              {rejectedCount > 0 && (
                                <Badge status="error" variant="secondary">
                                  {rejectedCount} rejected this session
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {justCompleted.type === "approved"
                              ? `Approved · ${data.id} · ${data.vendor}`
                              : `Rejected · ${data.id} · Reason: ${justCompleted.reason}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : justCompleted ? (
                    /* Just completed — alert + up next card */
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 custom-scrollbar">
                      <div
                        style={{
                          opacity: 0,
                          animation: "fadeIn 300ms ease 250ms forwards",
                        }}
                      >
                        {justCompleted.type === "approved" ? (
                          <Alert
                            status="default"
                            visual="outline"
                            className="border-success [&>svg]:text-success"
                          >
                            <Check className="h-4 w-4" />
                            <AlertTitle className="text-sm font-medium">
                              Invoice approved
                            </AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                              {data.id} · {data.vendor} · {data.amount}, sent
                              for payment processing.
                              <br />
                              {completedCount} of {totalInQueue} invoices
                              reviewed
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert status="error" visual="outline">
                            <X className="h-4 w-4" />
                            <AlertTitle className="text-sm font-medium">
                              Invoice rejected
                            </AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                              {data.id} · {data.vendor} · Reason:{" "}
                              {justCompleted.reason}
                              <br />
                              Vendor will be notified. Removed from your queue.
                            </AlertDescription>
                          </Alert>
                        )}
                        <Separator className="my-4" />
                        <UpNextCard
                          nextInvoice={nextInvoice}
                          onNext={onNextInvoice}
                          onBack={onBack}
                        />
                      </div>
                    </div>
                  ) : sentEmails.length > 0 && centerView === "findings" ? (
                    <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 pt-7 pb-6 custom-scrollbar">
                      <AwaitingResponseBlock
                        sentEmails={sentEmails}
                        onFollowUp={openEmailModal}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-8 pb-[136px] custom-scrollbar">
                      <ExceptionBlock
                        emailButtonState={
                          sentEmails.length > 0
                            ? "sent"
                            : emailModalOpen
                              ? "draft-open"
                              : "default"
                        }
                        onAction={(id, opts) =>
                          dispatchAction(id, "findings", opts)
                        }
                        onUndo={handleUndoState}
                        confirmed={confirmed}
                        dimContent={flagged || held}
                      />
                    </div>
                  )}
                  {!justCompleted &&
                    !completion &&
                    !flagged &&
                    !held &&
                    centerView === "findings" && <AskFooter />}
                </div>
              </>
            )}
          </div>
          <div
            className="inv-between-enter h-full"
            style={{ animationDelay: "120ms" }}
          >
            {version !== "v1" ? (
              <RightPanelNext
                tab={rightTab}
                onTabChange={onRightTabChange}
                commsIsNew={commsIsNew}
                onCommsViewed={() => setCommsIsNew(false)}
                extraTimelineEntries={extraTimelineEntries}
                onAddNote={handleAddNote}
                width={rightPanelWidth}
                onWidthChange={onRightPanelWidthChange}
              />
            ) : (
              <RightPanel
                tab={rightTab}
                onTabChange={onRightTabChange}
                commsIsNew={commsIsNew}
                onCommsViewed={() => setCommsIsNew(false)}
                extraTimelineEntries={extraTimelineEntries}
                onAddNote={handleAddNote}
                width={rightPanelWidth}
                onWidthChange={onRightPanelWidthChange}
              />
            )}
          </div>
        </div>

        {/* Email modal */}
        <Dialog
          open={emailModalOpen}
          onOpenChange={(open) => !open && closeEmailModal()}
        >
          <DialogContent className="!p-0 max-w-2xl h-[600px] overflow-hidden flex flex-col">
            <DialogTitle className="sr-only">Draft email</DialogTitle>
            <EmailPanelTab
              key={emailDraftKey}
              onSend={handleSend}
              onDiscard={discardEmailDraft}
            />
          </DialogContent>
        </Dialog>
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
  const [completionMap, setCompletionMap] = useState<
    Record<string, CompletionRecord>
  >({});
  // Flag/Hold ("parked") state per invoice — drives the queue card.
  const [parkedMap, setParkedMap] = useState<Record<string, ParkedState>>({});
  // Invoices where the reviewer has sent a "Contact supplier" email. Used
  // by the queue card to show "· Contacted supplier" next to the tag.
  const [contactedMap, setContactedMap] = useState<Record<string, boolean>>({});
  // Sent emails per invoice — lifted from the detail pane so the Comms feed
  // can show them, the count badge reflects them, and they persist across
  // invoice switches.
  const [sentEmailsMap, setSentEmailsMap] = useState<
    Record<string, SentEmail[]>
  >({});
  // Activity-log entries per invoice, so flags/actions persist across switches.
  const [activityMap, setActivityMap] = useState<
    Record<string, TimelineEntry[]>
  >({});
  const [rightTab, setRightTab] = useState<RightTab>("activity");
  const [centerView, setCenterView] = useState<CenterView>("findings");
  // How many Comms messages the reviewer has seen per invoice. New messages
  // arriving above this count drive the unread badge.
  const [commsSeenCount, setCommsSeenCount] = useState<Record<string, number>>(
    {},
  );
  // Slack-driven resolutions, keyed by invoice id, polled from the shared store.
  const [slackResolutions, setSlackResolutions] = useState<
    Record<string, SlackResolution>
  >({});
  // Posted card threads, keyed by ts → invoice id (from the store).
  const [slackCards, setSlackCards] = useState<Record<string, string>>({});
  // Resizable right-panel width (persists across invoice switches).
  const [rightPanelWidth, setRightPanelWidth] = useState(380);

  // Poll the shared store every 2s while a detail view is open so Slack-driven
  // actions show up in the product. Crude but reliable for a demo.
  useEffect(() => {
    if (phase === "list") return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/demo-state", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.invoices) {
          setSlackResolutions(data.invoices);
          setSlackCards(data.cards || {});
        }
      } catch {
        /* listener not running — ignore */
      }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = BETWEEN_INVOICE_STYLES;
    document.head.append(style);
    return () => {
      style.remove();
    };
  }, []);

  // Deep link: ?invoice=INV-XXXX opens that invoice's detail view directly
  // (e.g. the "View invoice in Apollo" link from the Slack card).
  useEffect(() => {
    const invoiceParam = new URLSearchParams(window.location.search).get(
      "invoice",
    );
    if (invoiceParam && detailDataMap[invoiceParam]) {
      setActiveInvoiceId(invoiceParam);
      setContentKey(invoiceParam);
      setListFading(true);
      setPhase("detail");
      setContentLoaded(true);
    }
  }, []);

  function handleRowClick(id: string) {
    setActiveInvoiceId(id);
    setContentKey(id);
    setListFading(true);
    setTimeout(() => setPhase("collapsing"), 60);
    setTimeout(() => setPhase("detail"), 300);
    setTimeout(() => setContentLoaded(true), 650);
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
    }, 130);
  }

  function handleComplete(type: "approved" | "rejected", reason?: string) {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const data = detailDataMap[activeInvoiceId];
    const record: CompletionRecord = {
      type,
      reason,
      time,
      by: data?.assignee ?? "You",
    };
    setCompletionMap((prev) => ({ ...prev, [activeInvoiceId]: record }));
  }

  function handleUndoComplete() {
    setCompletionMap((prev) => {
      const next = { ...prev };
      delete next[activeInvoiceId];
      return next;
    });
  }

  function handlePark(id: string, kind: "flag" | "hold", reason: string) {
    setParkedMap((prev) => ({ ...prev, [id]: { kind, reason } }));
  }

  function handleUnpark(id: string) {
    setParkedMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const approvedCount = Object.values(completionMap).filter(
    (r) => r.type === "approved",
  ).length;
  const rejectedCount = Object.values(completionMap).filter(
    (r) => r.type === "rejected",
  ).length;

  // Total Comms messages for the active invoice = seed thread + ingested/sent
  // Slack messages (from the polled store).
  const currentCommsCount =
    (commsDataMap[contentKey]?.length ?? 0) +
    (slackResolutions[contentKey]?.messages?.length ?? 0) +
    (sentEmailsMap[contentKey]?.length ?? 0);
  const commsUnread = Math.max(
    0,
    currentCommsCount - (commsSeenCount[contentKey] ?? 0),
  );

  function handleCommsViewed() {
    setCommsSeenCount((prev) => ({ ...prev, [contentKey]: currentCommsCount }));
  }

  // While the reviewer is viewing Comms, keep everything marked seen (so a
  // reply landing while they're looking doesn't badge).
  useEffect(() => {
    if (phase !== "list" && centerView === "comms") {
      setCommsSeenCount((prev) =>
        prev[contentKey] === currentCommsCount
          ? prev
          : { ...prev, [contentKey]: currentCommsCount },
      );
    }
  }, [phase, centerView, contentKey, currentCommsCount]);

  const activeIndex = invoicesReview.findIndex(
    (inv) => inv.id === activeInvoiceId,
  );
  const nextInvoice =
    invoicesReview
      .slice(activeIndex + 1)
      .find((inv) => !completionMap[inv.id]) ?? null;

  const prevInvoice = activeIndex > 0 ? invoicesReview[activeIndex - 1] : null;
  const hasPrev = prevInvoice !== null;
  const hasNext = activeIndex < invoicesReview.length - 1;

  function handlePrev() {
    if (prevInvoice) handleNavInvoiceClick(prevInvoice.id);
  }

  function handleNext() {
    const next = invoicesReview[activeIndex + 1];
    if (next) handleNavInvoiceClick(next.id);
  }

  useEffect(() => {
    if (phase === "list") return;
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" || e.key === "j") handlePrev();
      if (e.key === "ArrowRight" || e.key === "k") handleNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, activeIndex]);

  const isDetail = phase !== "list";

  return (
    <ApolloShell
      companyName="UiPath"
      productName="Invoice Processing"
      companyLogo={{
        url: "/UiPath.svg",
        darkUrl: "/UiPath_dark.svg",
        alt: "UiPath",
      }}
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
            transition: "width 210ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* List content — fades out on row click */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: listFading ? 0 : 1,
              transition: "opacity 60ms ease-out",
              pointerEvents: listFading ? "none" : "auto",
            }}
          >
            <InvoiceListView
              onRowClick={handleRowClick}
              completionMap={completionMap}
              parkedMap={parkedMap}
            />
          </div>

          {/* Left nav — fades in as panel collapses */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: isDetail ? 1 : 0,
              transition: isDetail
                ? "opacity 130ms ease-out 100ms"
                : "opacity 130ms ease-out 0ms",
              pointerEvents: isDetail ? "auto" : "none",
            }}
          >
            <LeftNav
              activeId={activeInvoiceId}
              onInvoiceClick={handleNavInvoiceClick}
              onBack={handleBack}
              completionMap={completionMap}
              parkedMap={parkedMap}
              contactedMap={contactedMap}
              onPrev={handlePrev}
              onNext={handleNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
              position={activeIndex + 1}
              total={invoicesReview.length}
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
                  completion={completionMap[contentKey]}
                  onComplete={handleComplete}
                  onUndoComplete={handleUndoComplete}
                  nextInvoice={nextInvoice}
                  onNextInvoice={() => {
                    if (nextInvoice) handleNavInvoiceClick(nextInvoice.id);
                  }}
                  onBack={handleBack}
                  totalInQueue={invoicesReview.length}
                  completedCount={Object.keys(completionMap).length}
                  approvedCount={approvedCount}
                  rejectedCount={rejectedCount}
                  rightTab={rightTab}
                  onRightTabChange={setRightTab}
                  centerView={centerView}
                  onCenterViewChange={setCenterView}
                  commsUnread={commsUnread}
                  commsCount={currentCommsCount}
                  onCommsViewed={handleCommsViewed}
                  slackResolution={slackResolutions[contentKey] ?? null}
                  hasActiveThread={Object.values(slackCards).includes(
                    contentKey,
                  )}
                  rightPanelWidth={rightPanelWidth}
                  onRightPanelWidthChange={setRightPanelWidth}
                  confirmed={parkedMap[contentKey] ?? null}
                  onPark={(kind, reason) =>
                    handlePark(contentKey, kind, reason)
                  }
                  onUnpark={() => handleUnpark(contentKey)}
                  onContacted={() =>
                    setContactedMap((prev) => ({ ...prev, [contentKey]: true }))
                  }
                  sentEmails={sentEmailsMap[contentKey] ?? []}
                  onAddSentEmail={(email) =>
                    setSentEmailsMap((prev) => ({
                      ...prev,
                      [contentKey]: [...(prev[contentKey] ?? []), email],
                    }))
                  }
                  extraTimelineEntries={activityMap[contentKey] ?? []}
                  setExtraTimelineEntries={(updater) =>
                    setActivityMap((prev) => ({
                      ...prev,
                      [contentKey]: updater(prev[contentKey] ?? []),
                    }))
                  }
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
      <InvoiceVersionProvider>
        <InvoiceRuntimeProvider>
          <ShellProfileExtrasProvider items={<LayoutVersionMenuItem />}>
            <InvoiceReviewContent />
          </ShellProfileExtrasProvider>
        </InvoiceRuntimeProvider>
      </InvoiceVersionProvider>
    </RouterContextProvider>
  );
}
