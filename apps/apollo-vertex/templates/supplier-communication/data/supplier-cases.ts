/**
 * Illustrative data for the Supplier Communications prototype.
 * Not real supplier information.
 */

/**
 * The demo's fixed "now". Anchored rather than read from the clock so the
 * relative times and date groups stay put: with a live clock every case drifts
 * into "Older" within a week and the grouping stops demonstrating anything.
 *
 * A Wednesday, chosen so day offsets 0-3 sit in this calendar week and 4-5 in
 * the previous one, which makes the "Earlier this week" heading literally true.
 */
export const NOW = "2026-07-22T10:30:00";

export type ControlState = "auto" | "review" | "locked";

export type WorkflowId = "w1" | "w2" | "w3" | "w4" | "w5" | "w6";

export type ApprovalStepState = "done" | "current" | "pending";

/** Status tint for a system-of-record row when it is shown as a factor. */
export type FactorStatus = "success" | "warning" | "error";

/** Who took an audit step. Defaults to "system" when the tuple omits it. */
export type AuditActor = "agent" | "person" | "system";

export interface ApprovalStep {
  state: ApprovalStepState;
  title: string;
  sub: string;
}

export interface SupplierCase {
  id: string;
  supplier: string;
  /** Local ISO datetime. Both the row's relative time and its date group derive from this. */
  receivedAt: string;
  wf: WorkflowId;
  wfLabel: string;
  subject: string;
  /** Classification confidence. Absent when the case came from a deterministic trigger. */
  confidence?: number;
  control: ControlState;
  controlLabel: string;
  /** True when a monitor or upstream workflow opened the case, not an inbound email. */
  trigger?: boolean;
  triggerReason?: string;
  email?: string;
  /**
   * The actual ask, without the greeting or sign-off. Authored per case rather
   * than parsed out of `email`: a heuristic for stripping salutations would
   * misfire on whichever message nobody checked.
   */
  excerpt?: string;
  /**
   * Field / value pairs read back from the system of record. The optional third
   * element tints the row when it is surfaced as a ConfidenceSignal factor.
   */
  sor?: Array<[string, string, FactorStatus?]>;
  /** Where `sor` was read from. Omitted when the read has no single named source. */
  source?: string;
  draft?: string;
  flag?: string;
  steps?: ApprovalStep[];
  note?: string;
  /** `[time, text, actor?]`. Actor defaults to "system" when omitted. */
  audit: Array<[string, string, AuditActor?]>;
}

export interface Workflow {
  id: WorkflowId;
  label: string;
  count: number;
}

export const WORKFLOWS: Workflow[] = [
  { id: "w1", label: "Status inquiry", count: 14 },
  { id: "w2", label: "Vendor master / bank change", count: 3 },
  { id: "w3", label: "Onboard indirect supplier", count: 2 },
  { id: "w4", label: "PO dispatch and acceptance", count: 5 },
  { id: "w5", label: "Statement reconciliation", count: 6 },
  { id: "w6", label: "Compliance document refresh", count: 1 },
];

export const KPIS = [
  { label: "Auto-resolved", value: "58%" },
  { label: "Median reply", value: "4m" },
  { label: "Open cases", value: "31" },
  { label: "Needs review", value: "6" },
  { label: "Escalated", value: "4" },
];

export const CASES: SupplierCase[] = [
  {
    id: "SC-10482",
    supplier: "Meridian Fasteners Co.",
    receivedAt: "2026-07-22T09:14:00",
    wf: "w1",
    wfLabel: "Status inquiry",
    subject: "Following up on invoice #INV-88291 payment status",
    confidence: 96,
    control: "auto",
    controlLabel: "Sent automatically",
    email:
      "Hi team,\n\nCould you confirm the status of invoice INV-88291? It's been a couple of weeks and our finance team is asking.\n\nThanks,\nR. Ostrowski\nMeridian Fasteners Co.",
    excerpt:
      "Could you confirm the status of invoice INV-88291? It's been a couple of weeks and our finance team is asking.",
    sor: [
      ["Invoice", "INV-88291"],
      ["Posting status", "Approved"],
      ["Payment status", "Scheduled"],
      ["Scheduled date", "2026-07-28"],
    ],
    source: "SAP",
    draft:
      "Hi R. Ostrowski,\n\nThanks for checking in. Invoice INV-88291 has been approved and is scheduled for payment on 2026-07-28. You'll receive a remittance advice once it clears.\n\nBest,\nAP Team",
    audit: [
      ["09:14", "Email received, classified as status inquiry (96%)", "agent"],
      ["09:14", "Invoice status retrieved from SAP", "system"],
      ["09:15", "Reply drafted and sent — auto-send threshold met", "agent"],
    ],
  },
  {
    id: "SC-10479",
    supplier: "Nordic Components AB",
    receivedAt: "2026-07-22T08:52:00",
    wf: "w1",
    wfLabel: "Status inquiry",
    subject: "Any update on PO 4471 invoice?",
    confidence: 61,
    control: "review",
    controlLabel: "Needs review",
    email:
      "Hello,\n\nJust checking on the invoice tied to PO 4471 — think we sent two around that time, want to make sure both are being processed.\n\nRegards,\nS. Lindqvist",
    excerpt:
      "Just checking on the invoice tied to PO 4471 — think we sent two around that time, want to make sure both are being processed.",
    sor: [
      ["PO 4471 — linked invoices", "2 found"],
      ["INV-77120", "Approved, paid 07/10", "success"],
      ["INV-77205", "Pending approval — missing GRN", "warning"],
    ],
    source: "SAP",
    draft:
      "Hi S. Lindqvist,\n\nWe found two invoices linked to PO 4471. INV-77120 was paid on 07/10. INV-77205 is pending — it's missing a goods-receipt confirmation on our side; we're following up internally.\n\nBest,\nAP Team",
    flag: "Below the auto-send threshold: two invoices referenced, one has an unresolved exception. Review before sending.",
    audit: [
      ["08:52", "Email received, classified as status inquiry (61%)", "agent"],
      ["08:52", "Two linked invoices found — ambiguity flagged", "agent"],
      ["08:53", "Routed to the human review queue", "system"],
    ],
  },
  {
    id: "SC-10471",
    supplier: "Atlas Precision GmbH",
    receivedAt: "2026-07-21T16:20:00",
    wf: "w2",
    wfLabel: "Bank detail change",
    subject: "Updated banking details for remittance",
    confidence: 89,
    control: "locked",
    controlLabel: "Second approver",
    email:
      "Hello,\n\nOur remittance bank account has changed as of this month. New IBAN details attached. Please update our vendor record.\n\nThanks,\nFinance Team, Atlas Precision GmbH",
    excerpt:
      "Our remittance bank account has changed as of this month. New IBAN details attached. Please update our vendor record.",
    steps: [
      {
        state: "done",
        title: "Change request detected and extracted",
        sub: "New IBAN parsed from the attached document",
      },
      {
        state: "done",
        title: "Independent verification",
        sub: "Call-back completed to the known-good contact on file — confirmed",
      },
      {
        state: "current",
        title: "Second approver (four eyes)",
        sub: "Assigned to Jonas M., Finance Controls — awaiting review",
      },
      {
        state: "pending",
        title: "Update the system of record",
        sub: "Blocked until the second approval lands",
      },
      {
        state: "pending",
        title: "Confirm to the supplier",
        sub: "Blocked until the update completes",
      },
    ],
    note: "Banking changes are never executed automatically. This case cannot proceed without a second approver, distinct from the person who verified it.",
    audit: [
      [
        "Yesterday",
        "Change request detected, extracted (89% confidence)",
        "agent",
      ],
      [
        "Yesterday",
        "Independent verification call completed — match confirmed",
        "person",
      ],
      ["Yesterday", "Routed to Jonas M. for second approval", "system"],
    ],
  },
  {
    id: "SC-10461",
    supplier: "Delta Packaging Ltd",
    receivedAt: "2026-07-20T11:05:00",
    wf: "w5",
    wfLabel: "Statement reconciliation",
    subject: "Statement shows 3 open items we don't recognize",
    confidence: 82,
    control: "review",
    controlLabel: "Partly resolved",
    email:
      "Hi,\n\nOur latest statement shows 3 items still open on your side that we believe are settled. Can you check INV-51002, INV-51009, and INV-51014?\n\nThanks,\nDelta Packaging AR",
    excerpt:
      "Our latest statement shows 3 items still open on your side that we believe are settled. Can you check INV-51002, INV-51009, and INV-51014?",
    sor: [
      [
        "INV-51002",
        "Timing difference — payment in transit, clears 07/22",
        "success",
      ],
      [
        "INV-51009",
        "Timing difference — payment in transit, clears 07/22",
        "success",
      ],
      ["INV-51014", "Short-paid $412 — deduction code unclear", "warning"],
    ],
    source: "SAP",
    draft:
      "Hi Delta Packaging AR,\n\nINV-51002 and INV-51009 are in transit and will clear by 07/22 — no action needed. INV-51014 shows a $412 short-payment on our side that we can't yet explain; we're opening a formal case to investigate and will follow up separately.\n\nBest,\nAP Team",
    flag: "2 of 3 items explained automatically (timing). 1 item escalated to a formal dispute — the deduction code doesn't match any known reason.",
    audit: [
      [
        "2 days ago",
        "Statement received, matched against 3 open items",
        "system",
      ],
      ["2 days ago", "2 items reconciled automatically (timing)", "system"],
      ["2 days ago", "1 item opened as formal dispute case DSP-2214", "system"],
    ],
  },
  {
    id: "SC-10450",
    supplier: "Kestrel Machining",
    receivedAt: "2026-07-19T14:40:00",
    wf: "w3",
    wfLabel: "Onboarding",
    subject: "New supplier onboarding — indirect (tooling)",
    confidence: 74,
    control: "locked",
    controlLabel: "With compliance",
    email:
      "Hi,\n\nAttaching our W-9 and banking info to get set up as a supplier. Let us know if you need anything else.\n\nKestrel Machining LLC",
    excerpt:
      "Attaching our W-9 and banking info to get set up as a supplier. Let us know if you need anything else.",
    sor: [
      [
        "Entity match",
        "Partial name match on screening list — unresolved",
        "warning",
      ],
      ["Tax ID", "Validated", "success"],
      ["Bank validation", "Passed", "success"],
    ],
    source: "Sanctions screening list",
    note: "Sanctions and PEP screening returned a partial name match that the agent cannot clear on data alone. Routed to compliance for manual review before any record is created.",
    audit: [
      ["3 days ago", "Conversational intake completed", "agent"],
      ["3 days ago", "Tax ID and bank validation passed", "system"],
      [
        "3 days ago",
        "Partial screening match — escalated to compliance, no record created",
        "system",
      ],
    ],
  },
  {
    id: "SC-10440",
    supplier: "Vantage Sealing Systems",
    receivedAt: "2026-07-18T09:05:00",
    wf: "w6",
    wfLabel: "Compliance refresh",
    subject: "Reminder: certificate of insurance expires 2026-08-02",
    trigger: true,
    triggerReason:
      "The certificate expiry date crossed the 30-day lead-time threshold. This case started from monitoring, not an inbound email.",
    control: "auto",
    controlLabel: "Outreach sent",
    sor: [
      ["Document type", "Certificate of insurance"],
      ["Current expiry", "2026-08-02"],
      ["Lead-time policy", "30 days before expiry"],
      ["Prior renewals", "2 (both on time)"],
    ],
    source: "document store",
    draft:
      "Hi Vantage Sealing Systems team,\n\nOur records show your certificate of insurance is set to expire on 2026-08-02. To avoid any interruption to active POs, could you send an updated certificate before then?\n\nThanks,\nSupplier Compliance Team",
    audit: [
      [
        "4 days ago",
        "Expiry monitor flagged the certificate within the 30-day window",
        "system",
      ],
      [
        "4 days ago",
        "Outreach drafted and sent automatically — low-risk, non-financial action",
        "agent",
      ],
      ["Today", "No response yet — reminder #2 scheduled in 3 days", "system"],
    ],
  },
  {
    id: "SC-10432",
    supplier: "Harborview Logistics",
    receivedAt: "2026-07-17T15:30:00",
    wf: "w4",
    wfLabel: "PO dispatch",
    subject: "PO-99215 dispatched — awaiting acknowledgement",
    trigger: true,
    triggerReason:
      "The PO was approved and released for dispatch. This case started from the PO workflow, not an inbound email.",
    control: "review",
    controlLabel: "Awaiting response",
    sor: [
      ["PO number", "PO-99215"],
      ["Line items", "3"],
      ["Dispatch channel", "Email (no EDI on file)"],
      ["Acknowledgement window", "5 business days"],
    ],
    source: "SAP",
    draft:
      "Hi Harborview Logistics,\n\nPlease find attached PO-99215 for your review. Kindly confirm acceptance, or flag any changes to price, quantity, or lead time, within 5 business days.\n\nThanks,\nProcurement Team",
    flag: "No acknowledgement after 3 of 5 days. The first reminder is scheduled for tomorrow; the buyer is notified if there's no response by day 5.",
    audit: [
      [
        "5 days ago",
        "PO dispatched by email — no EDI or cXML on file for this supplier",
        "system",
      ],
      ["2 days ago", "No acknowledgement yet — within the window", "system"],
      ["Today", "Reminder cadence scheduled", "system"],
    ],
  },
];

export interface SupplierThread {
  id: string;
  from: string;
  to: string;
  /** Local ISO datetime, same basis as SupplierCase.receivedAt. */
  receivedAt: string;
  subject: string;
  preview: string;
  body: string;
  /** Explains what happened on the AP side to produce this message. */
  context: string;
}

export const SUPPLIER_THREADS: SupplierThread[] = [
  {
    id: "mail-1",
    from: "AP Team <ap-noreply@customer.com>",
    to: "R. Ostrowski, Meridian Fasteners Co.",
    receivedAt: "2026-07-22T09:15:00",
    subject: "Re: Following up on invoice #INV-88291 payment status",
    preview: "Invoice INV-88291 has been approved and is scheduled…",
    body: "Hi R. Ostrowski,\n\nThanks for checking in. Invoice INV-88291 has been approved and is scheduled for payment on 2026-07-28. You'll receive a remittance advice once it clears.\n\nBest,\nAP Team",
    context:
      "The AP team's agent sent this reply automatically. It's case SC-10482 in the AP view, seen from the other side.",
  },
  {
    id: "mail-2",
    from: "Supplier Compliance Team <compliance-noreply@customer.com>",
    to: "Vantage Sealing Systems",
    receivedAt: "2026-07-18T09:05:00",
    subject: "Reminder: certificate of insurance expires 2026-08-02",
    preview: "Our records show your certificate of insurance is set to…",
    body: "Hi Vantage Sealing Systems team,\n\nOur records show your certificate of insurance is set to expire on 2026-08-02. To avoid any interruption to active POs, could you send an updated certificate before then?\n\nThanks,\nSupplier Compliance Team",
    context:
      "Nobody asked a question first — monitoring started this one. Case SC-10440 re-sends on a schedule until the certificate arrives.",
  },
];
