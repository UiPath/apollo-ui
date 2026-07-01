// Block Kit builder for the agent's escalation card. Mirrors the in-product
// Slack card (price mismatch on INV-GRN-001). Action IDs follow the
// `invoice_action_*` pattern so the listener's regex handler can route them,
// and each button's `value` carries { invoice_id, action } so the handler
// needs no message-metadata lookup.

const DEMO_INVOICE = {
  id: "INV-GRN-001",
  vendor: "ACME Industrial",
  invoiced: "$694.39",
  poAgreed: "$689.55",
  difference: "$4.84",
  po: "PO-460035919",
};

// Where the prototype is served — used for the "View invoice in Apollo" deep link.
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

// opts: { invoiceId, escalatedBy, note }
// The card body uses the demo invoice's figures; invoiceId flows into the
// action button values so a click resolves the right invoice in the product.
function buildEscalationBlocks(opts = {}) {
  const {
    invoiceId = DEMO_INVOICE.id,
    escalatedBy,
    note,
    appBaseUrl = APP_BASE_URL,
  } = opts;
  const inv = { ...DEMO_INVOICE, id: invoiceId };
  const blocks = [];

  // Escalator context (top) — who escalated and their optional note.
  if (escalatedBy) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: note
            ? `Escalated by ${escalatedBy} · ${note}`
            : `Escalated by ${escalatedBy}`,
        },
      ],
    });
  }

  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Price mismatch on ${inv.id} from ${inv.vendor}.* Invoice exceeds the PO-agreed price by ${inv.difference}. Holding for review.`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Invoiced*\n${inv.invoiced}` },
        { type: "mrkdwn", text: `*PO agreed*\n${inv.poAgreed}` },
        { type: "mrkdwn", text: `*Difference*\n:warning: +${inv.difference}` },
      ],
    },
    {
      type: "actions",
      block_id: "invoice_actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Approve anyway" },
          style: "primary",
          action_id: "invoice_action_approve",
          value: JSON.stringify({ invoice_id: inv.id, action: "approve" }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Hold for correction" },
          action_id: "invoice_action_hold",
          value: JSON.stringify({ invoice_id: inv.id, action: "hold" }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Reject" },
          style: "danger",
          action_id: "invoice_action_reject",
          value: JSON.stringify({ invoice_id: inv.id, action: "reject" }),
        },
      ],
    },
    // Deep link back to the invoice in the product (bottom).
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `🔗 <${appBaseUrl}/invoice-review?invoice=${inv.id}|View invoice>`,
        },
      ],
    },
  );

  return blocks;
}

// Plain-text fallback shown in notifications and by screen readers.
function escalationFallbackText(invoiceId = DEMO_INVOICE.id) {
  return `Price mismatch on ${invoiceId} from ${DEMO_INVOICE.vendor} — exceeds PO by ${DEMO_INVOICE.difference}. Action needed in #ap-exceptions.`;
}

module.exports = {
  DEMO_INVOICE,
  buildEscalationBlocks,
  escalationFallbackText,
};
