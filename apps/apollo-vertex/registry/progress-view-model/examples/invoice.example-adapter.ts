/**
 * EXAMPLE ADAPTER. Not shipped in any registry item: it shows how a solution
 * maps its own data (invoice processing) into the neutral progress view model. The
 * occupants never import it.
 */
import {
  deriveStages,
  type ProgressActor,
  type ProgressEvent,
  type ProgressViewModel,
} from "../progress-view-model";

type InvoiceEventKind =
  | "received"
  | "extracted"
  | "matched"
  | "flagged"
  | "reviewing"
  | "confirming";

interface InvoiceEvent {
  id: string;
  kind: InvoiceEventKind;
  title: string;
  detail: string;
  time: string;
  reviewer?: { name: string; initials: string };
}

interface Invoice {
  number: string;
  events: InvoiceEvent[];
}

const AGENT: ProgressActor = { kind: "agent", name: "Invoice agent" };

const STAGES = [
  { id: "received", label: "Received" },
  { id: "extracted", label: "Extracted" },
  { id: "matched", label: "Matched" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Payment" },
];

const STAGE_OF: Record<InvoiceEventKind, string> = {
  received: "received",
  extracted: "extracted",
  matched: "matched",
  flagged: "review",
  reviewing: "review",
  confirming: "review",
};

const STATUS_OF: Record<InvoiceEventKind, ProgressEvent["status"]> = {
  received: "done",
  extracted: "done",
  matched: "done",
  flagged: "needs-attention",
  reviewing: "in-progress",
  confirming: "in-progress",
};

export function invoiceToProgress(invoice: Invoice): ProgressViewModel {
  const events = invoice.events.map(
    (event): ProgressEvent => ({
      id: event.id,
      actor: event.reviewer ? { kind: "person", ...event.reviewer } : AGENT,
      status: STATUS_OF[event.kind],
      title: event.title,
      detail: event.detail,
      time: event.time,
      stageId: STAGE_OF[event.kind],
    }),
  );
  return {
    subject: invoice.number,
    events,
    stages: deriveStages(STAGES, events),
  };
}

/** Sample data: an invoice flagged for review. */
export const SAMPLE_INVOICE: Invoice = {
  number: "INV-4021",
  events: [
    {
      id: "e1",
      kind: "received",
      title: "Invoice received",
      detail: "INV-4021 from Acme Corp, by email.",
      time: "Sep 12, 9:02",
    },
    {
      id: "e2",
      kind: "extracted",
      title: "Agent extracted fields",
      detail: "Vendor, dates, 5 line items, and totals.",
      time: "Sep 12, 9:03",
    },
    {
      id: "e3",
      kind: "matched",
      title: "Agent matched PO",
      detail: "Matched to PO-88213. Prices within 0.5%.",
      time: "Sep 12, 9:03",
    },
    {
      id: "e4",
      kind: "flagged",
      title: "Flagged for review",
      detail:
        "Bank details changed 3 days ago. Hours billed differ from receipt.",
      time: "Sep 12, 9:04",
    },
    {
      id: "e5",
      kind: "reviewing",
      reviewer: { name: "Mei Chen", initials: "MC" },
      title: "Mei Chen is reviewing",
      detail: "Assigned from the AP review queue.",
      time: "Sep 13, 10:15",
    },
    {
      id: "e6",
      kind: "confirming",
      title: "Agent confirming bank details",
      detail: "Waiting on a reply from Acme Corp.",
      time: "Sep 13, 10:21",
    },
  ],
};

/** The sample, mapped. */
export const INVOICE_PROGRESS = invoiceToProgress(SAMPLE_INVOICE);
