// Shared invoice state for the demo. The Slack listener writes here; the
// prototype reads it (via /api/demo-state) and reflects changes in the UI.
// A JSON file is the source of truth — no DB needed for 8 demo invoices.
// Writes are atomic (write temp + rename) to avoid partial reads under races.

const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "demo-state.json");

const STATUS_BY_ACTION = {
  approve: "approved",
  hold: "on_hold",
  reject: "rejected",
};

function blankInvoice() {
  return {
    status: "awaiting_decision",
    action: null,
    resolved_at: null,
    resolved_by: null,
    resolved_via: null,
    messages: [], // thread replies ingested from Slack
  };
}

// Known starting state for the demo. The reset script returns to exactly this.
function initialState() {
  return {
    invoices: {
      "INV-GRN-001": blankInvoice(),
    },
    // Maps a posted card's ts -> invoice id. Used to (a) route thread replies
    // back to the right invoice and (b) delete the bot's cards on reset.
    cards: {},
    updated_at: null,
  };
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) writeState(initialState());
}

function readState() {
  ensure();
  try {
    const state = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    if (!state.cards) state.cards = {};
    return state;
  } catch {
    return initialState();
  }
}

function writeState(state) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  state.updated_at = new Date().toISOString();
  const tmp = `${STORE_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STORE_PATH); // atomic on the same filesystem
  return state;
}

// Record a resolution from a Slack action. action is approve | hold | reject.
// Preserves any ingested thread messages.
function resolveInvoice(invoiceId, { action, by }) {
  const state = readState();
  const prev = state.invoices[invoiceId] || blankInvoice();
  state.invoices[invoiceId] = {
    ...prev,
    status: STATUS_BY_ACTION[action] || "awaiting_decision",
    action,
    resolved_at: new Date().toISOString(),
    resolved_by: by || "Someone",
    resolved_via: "slack",
  };
  writeState(state);
  return state.invoices[invoiceId];
}

// Map a posted card's ts to its invoice (for thread-reply routing + reset).
function recordCard(ts, invoiceId) {
  const state = readState();
  state.cards[ts] = invoiceId;
  writeState(state);
  return state.cards;
}

// Which invoice (if any) does this thread_ts belong to?
function invoiceForThread(threadTs) {
  return readState().cards[threadTs] || null;
}

// The (latest) card thread for an invoice — used to post product replies back.
function threadForInvoice(invoiceId) {
  const cards = readState().cards || {};
  const matches = Object.keys(cards).filter((ts) => cards[ts] === invoiceId);
  if (!matches.length) return null;
  matches.sort((a, b) => Number(b) - Number(a));
  return matches[0];
}

// Append an ingested Slack thread reply. Deduped by external_id.
// Returns true if added, false if it was a duplicate.
function addMessage(invoiceId, message) {
  const state = readState();
  const inv = state.invoices[invoiceId] || blankInvoice();
  if (!Array.isArray(inv.messages)) inv.messages = [];
  if (
    message.external_id &&
    inv.messages.some((m) => m.external_id === message.external_id)
  ) {
    state.invoices[invoiceId] = inv;
    writeState(state);
    return false;
  }
  inv.messages.push(message);
  state.invoices[invoiceId] = inv;
  writeState(state);
  return true;
}

function resetInvoice(invoiceId) {
  const state = readState();
  state.invoices[invoiceId] = blankInvoice();
  // Drop any card mappings pointing at this invoice (start the thread fresh).
  for (const ts of Object.keys(state.cards)) {
    if (state.cards[ts] === invoiceId) delete state.cards[ts];
  }
  writeState(state);
  return state.invoices[invoiceId];
}

function resetAll() {
  return writeState(initialState());
}

module.exports = {
  STORE_PATH,
  STATUS_BY_ACTION,
  initialState,
  ensure,
  readState,
  writeState,
  resolveInvoice,
  recordCard,
  invoiceForThread,
  threadForInvoice,
  addMessage,
  resetInvoice,
  resetAll,
};
