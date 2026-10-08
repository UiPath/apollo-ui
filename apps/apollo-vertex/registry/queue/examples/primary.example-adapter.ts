/**
 * EXAMPLE ADAPTER (primary). Not shipped: it shows how a solution (invoice
 * exceptions) maps its own data into the queue view model. Adapters belong
 * to solutions.
 */
import type { OccupantTone } from "@/components/ui/occupant";
import type { QueueViewModel } from "../queue.view-model";

type ExceptionCode =
  | "missing_po"
  | "vat_mismatch"
  | "no_fx_rate"
  | "price_mismatch"
  | "outside_po_period"
  | "billing_account_not_found"
  | "goods_not_received"
  | "duplicate_suspected";

interface InvoiceException {
  invoiceNumber?: string;
  supplierName: string;
  amount: { value: number; currency: "USD" | "EUR" | "GBP" };
  /** Most severe first. */
  exceptions: {
    code: ExceptionCode;
    severity: "blocking" | "review" | "info";
  }[];
  paymentDueOn: Date;
  workflowState: "awaiting_review" | "on_hold" | "resolved";
}

const EXCEPTION_LABEL: Record<ExceptionCode, string> = {
  missing_po: "Missing PO",
  vat_mismatch: "VAT mismatch",
  no_fx_rate: "No exchange rate",
  price_mismatch: "Price mismatch",
  outside_po_period: "Outside PO period",
  billing_account_not_found: "Billing account not found",
  goods_not_received: "Goods not received",
  duplicate_suspected: "Possible duplicate",
};

const SEVERITY_TONE: Record<
  InvoiceException["exceptions"][number]["severity"],
  OccupantTone
> = {
  blocking: "error",
  review: "warning",
  info: "info",
};

const FILTERS = [
  { id: "awaiting_review", label: "Waiting" },
  { id: "on_hold", label: "On hold" },
  { id: "resolved", label: "Done" },
] satisfies { id: InvoiceException["workflowState"]; label: string }[];

// A fixed day, so the example groups the same way every time.
const TODAY = new Date(2026, 8, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function dueGroup(dueOn: Date): string {
  const days = Math.round((dueOn.getTime() - TODAY.getTime()) / DAY_MS);
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return "Due later";
}

const money = (amount: InvoiceException["amount"]) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: amount.currency,
    maximumFractionDigits: 0,
  }).format(amount.value);

export function exceptionsToQueue(
  batch: string,
  invoices: InvoiceException[],
): QueueViewModel {
  return {
    subject: batch,
    filters: FILTERS,
    items: invoices
      .toSorted((a, b) => a.paymentDueOn.getTime() - b.paymentDueOn.getTime())
      .map((invoice, index) => {
        const [first, ...rest] = invoice.exceptions;
        return {
          id: invoice.invoiceNumber ?? `unnumbered-${index}`,
          title: invoice.supplierName,
          value: money(invoice.amount),
          status: {
            label: first ? EXCEPTION_LABEL[first.code] : "Ready to post",
            tone: first ? SEVERITY_TONE[first.severity] : "success",
            ...(rest.length > 0 && { more: rest.length }),
          },
          ...(invoice.invoiceNumber && { reference: invoice.invoiceNumber }),
          group: dueGroup(invoice.paymentDueOn),
          filter: invoice.workflowState,
        };
      }),
  };
}

const tomorrow = new Date(TODAY.getTime() + DAY_MS);

export const PRIMARY = exceptionsToQueue("Invoice exceptions", [
  {
    invoiceNumber: "INV-84471",
    supplierName: "Acme Supply Co.",
    amount: { value: 12_240, currency: "USD" },
    exceptions: [{ code: "missing_po", severity: "blocking" }],
    paymentDueOn: TODAY,
    workflowState: "awaiting_review",
  },
  {
    invoiceNumber: "INV-66216",
    supplierName: "Prime Office Solutions",
    amount: { value: 65_800, currency: "USD" },
    exceptions: [
      { code: "vat_mismatch", severity: "review" },
      { code: "price_mismatch", severity: "review" },
    ],
    paymentDueOn: TODAY,
    workflowState: "awaiting_review",
  },
  {
    invoiceNumber: "INV-91003",
    supplierName: "NorthStar LLC",
    amount: { value: 8750, currency: "GBP" },
    exceptions: [
      { code: "no_fx_rate", severity: "info" },
      { code: "vat_mismatch", severity: "review" },
    ],
    paymentDueOn: TODAY,
    workflowState: "on_hold",
  },
  {
    invoiceNumber: "INV-GRN-001",
    supplierName: "ACME Industrial",
    amount: { value: 694, currency: "USD" },
    exceptions: [{ code: "price_mismatch", severity: "blocking" }],
    paymentDueOn: TODAY,
    workflowState: "awaiting_review",
  },
  {
    invoiceNumber: "INV-55832",
    supplierName: "Meridian Group",
    amount: { value: 22_500, currency: "EUR" },
    exceptions: [
      { code: "outside_po_period", severity: "review" },
      { code: "goods_not_received", severity: "review" },
    ],
    paymentDueOn: tomorrow,
    workflowState: "awaiting_review",
  },
  {
    invoiceNumber: "INV-60118",
    supplierName: "Crestwood Co.",
    amount: { value: 940, currency: "USD" },
    exceptions: [
      { code: "billing_account_not_found", severity: "blocking" },
      { code: "missing_po", severity: "blocking" },
      { code: "vat_mismatch", severity: "review" },
    ],
    paymentDueOn: tomorrow,
    workflowState: "on_hold",
  },
  {
    invoiceNumber: "INV-30291",
    supplierName: "CDW Netherlands",
    amount: { value: 18_400, currency: "EUR" },
    exceptions: [
      { code: "goods_not_received", severity: "blocking" },
      ...Array.from({ length: 7 }, () => ({
        code: "price_mismatch" as const,
        severity: "review" as const,
      })),
    ],
    paymentDueOn: tomorrow,
    workflowState: "awaiting_review",
  },
  {
    // Scanned without a number: no reference to show yet.
    supplierName: "Harbor Logistics",
    amount: { value: 3120, currency: "USD" },
    exceptions: [{ code: "duplicate_suspected", severity: "review" }],
    paymentDueOn: tomorrow,
    workflowState: "awaiting_review",
  },
  {
    invoiceNumber: "INV-71245",
    supplierName: "Blue Ridge Paper",
    amount: { value: 1480, currency: "USD" },
    exceptions: [],
    paymentDueOn: tomorrow,
    workflowState: "resolved",
  },
  {
    invoiceNumber: "INV-48830",
    supplierName: "Kestrel Components",
    amount: { value: 5260, currency: "GBP" },
    exceptions: [{ code: "no_fx_rate", severity: "info" }],
    paymentDueOn: tomorrow,
    workflowState: "on_hold",
  },
]);
