// oxlint-disable max-lines -- open-question register, grows by design as prompts add entries

// J3's open-question register. Each entry names something pending a ruling
// from product or design. Referencing ph("PH-0x") keeps the gap visible in
// the running prototype and greppable in the source, instead of a
// plausible-looking value standing in for a decision nobody made.

export const PLACEHOLDERS = {
  "PH-01": { description: "absolute date timeline" },
  "PH-03": { description: "v2 file size", provisional: "856 KB" },
  "PH-07": {
    description:
      "Dana Kim role reuse, and whether Dana L. on REQ-10471 is the same person",
  },
  "PH-08": { description: "DocuSign labelling at V2" },
  "PH-10": {
    description: "composer placeholder for Priya",
    provisional: "Attach an order form and I'll read it",
  },
  "PH-11": {
    description: "reworded copy pending confirmation, tagged inline where used",
  },
  "PH-12": {
    description: "payment terms assistant note",
    provisional:
      "Net 30 is what the order form says. Procurement checks it against the agreement after you submit.",
  },
  "PH-13a": {
    description: "vendor recommendation headline wording",
    provisional: "ConnectMeet is already under contract",
  },
  "PH-13b": {
    description: "vendor recommendation rationale wording",
    provisional:
      "Your incumbent for video conferencing, and MSA-VC-01 covers this purchase",
  },
  "PH-13c": {
    description: "vendor recommendation basis line wording",
    provisional: "From your current agreements and preferred suppliers",
  },
  "PH-14": {
    description: "vendor step footer affordance copy",
    provisional: "Not seeing the vendor you need?",
  },
  "PH-15a": {
    description: "data and info step heading",
    provisional: "A few questions about this software",
  },
  "PH-15b": {
    description: "data and info step sub-line",
    provisional: "Your answers decide which reviews this request needs",
  },
  "PH-19a": {
    description:
      "review step heading naming the approver and the procurement-then-approval routing (Priya's case: procurement review required before Dana Kim decides), pending Gabriel's wording ruling",
    provisional: "Ready for procurement validation",
  },
  "PH-19b": {
    description:
      "review step sub-line stating the procurement-review requirement before the named approver decides, pending Gabriel's wording ruling",
    provisional:
      "Procurement checks the commercials, then it routes to budget approval",
  },
  "PH-20": { description: "review policy check banner content" },
  "PH-21a": {
    description: "submitted state heading",
    provisional: "Request submitted",
  },
  "PH-21b": {
    description: "submitted state routing sub-line",
    provisional:
      "Procurement validation has started. You will be notified as it moves.",
  },
  "PH-22": {
    description: "submitted state waiting note",
    provisional:
      "With procurement now. The reviews your answers added run after budget approval.",
  },
  "PH-23": {
    description: "bare flow route composer footnote",
    provisional: "Requests stay in sync across Teams, web, and email",
  },
  "PH-24a": {
    description: "MeetHub vendor comparison content",
    provisional:
      "MeetHub is also preferred and under contract, so it clears procurement the same way. Switching restarts commercial review, since pricing and terms would be negotiated fresh. Worth it only if ConnectMeet cannot meet the September date.",
  },
  "PH-24b": {
    description: "Vantage AV vendor comparison content",
    provisional:
      "Vantage AV is approved but has no contract in place, so this purchase would need contracting before it can proceed. That adds time ahead of the September date. Worth considering if AV hardware comes into scope later.",
  },
  "PH-25": {
    description: "Q1 consequence line when answered no",
    provisional: "No data protection review is needed",
  },
  "PH-26": {
    description: "REQ-10482 queue card due time",
    provisional: "5:00 PM",
  },
  "PH-27": { description: "REQ-10482 Workbench detail finding tag" },
  "PH-28": { description: "REQ-10482 Workbench detail finding headline" },
  "PH-29": { description: "REQ-10482 Workbench detail finding body" },
  "PH-30": { description: "REQ-10482 Workbench detail approved confirmation" },
  "PH-31": { description: "REQ-10482 Workbench detail countered confirmation" },
  "PH-32": { description: "REQ-10482 Workbench detail rejected confirmation" },
  "PH-33": {
    description: "REQ-10482 Workbench detail source document preview lines",
    provisional: "Order form, 3 pages. Pricing in section 2.",
  },
  "PH-34": {
    description:
      "REQ-10482 payment term exception request action, unwired no-op pending a ruling on its behaviour",
    provisional: "Request an exception",
  },
  "PH-35": {
    description:
      "REQ-10482 flag for review action, unwired no-op pending a ruling on its behaviour",
    provisional: "Flag for review",
  },
  "PH-36": {
    description:
      "REQ-10482 Workbench detail note composer placeholder, audience-naming copy pending",
    provisional: "Ask Priya or the supplier a question",
  },
  "PH-37": {
    description:
      "Workbench header record level disposition (e.g. hold or reassign), unwired no-op pending a ruling on its content",
  },
  "PH-38": {
    description:
      "Workbench queue empty segment copy, pending a ruling on its wording",
    provisional: "Nothing here right now",
  },
  "PH-40": {
    description:
      "REQ-10482 share feedback link destination, unwired no-op pending a ruling on its behaviour",
    provisional: "Share feedback",
  },
  "PH-41": {
    description:
      "REQ-10482 Workbench detail agent card label, pending a ruling on its wording",
    provisional: "Benchmark",
  },
  "PH-44": {
    description:
      "REQ-10482 comparable deals row label naming it as the current order, wording pending a ruling",
    provisional: "This order",
  },
  "PH-45": {
    description:
      "REQ-10482 payment terms check column display label, one per typed check value (deviates, governing, consistent), pending a ruling on wording",
    provisional: {
      deviates: "Deviates",
      governing: "Governing",
      consistent: "Consistent",
    },
  },
  "PH-46": {
    description:
      "REQ-10482 decision page exceptions-resolved module heading, pending a ruling on its wording",
  },
  "PH-47": {
    description:
      "REQ-10482 decision page evidence drill-through link label, unwired no-op pending a ruling on its behaviour and destination",
  },
  "PH-48": {
    description:
      "REQ-10482 decision page order form attachment state note (e.g. corrected and validated), pending a ruling on its wording",
  },
  "PH-49": {
    description:
      "REQ-10482 budget-remaining detail line wording, shares REQ-2052's own \"$X of $Y remaining\" grammar, which reads as X being what remains rather than what this request draws down; not corrected here since fixing the shared phrasing would also change REQ-2052's own line, pending a ruling",
  },
  "PH-51": {
    description:
      "REQ-10482 decision page pending-state AI summary sentence wording, cleared/closed-by say the same thing twice, the exception count is a bare numeral, and the sentence is purely retrospective rather than orienting Dana toward the decision in front of her, pending a ruling",
  },
  "PH-52": {
    description:
      "REQ-10482 P1 downstream track stage label(s) after Dana's decision, must not name the parallel legal and security review (P2, a later chunk), pending a ruling on wording and count",
  },
  "PH-53": {
    description:
      "REQ-10482 check chip label for the price benchmark check, pending a ruling on wording",
  },
  "PH-54": {
    description:
      "REQ-10482 check chip label for the contract terms check, pending a ruling on wording",
  },
  "PH-55": {
    description:
      "REQ-10482 check chip label for the exceptions cleared check, pending a ruling on wording",
  },
  "PH-56": {
    description:
      "REQ-10482 decision page P2 multi-year commitment module wording, pending a ruling",
  },
  "PH-57": {
    description:
      "REQ-10482 decision page order form preview stub body content, not a real document render, pending a ruling on wording",
  },
  "PH-58": {
    description:
      "Priya Nair seeded request row (requester parity, second row): title, supplier, and amount, pending a ruling",
  },
  "PH-59": {
    description:
      "Priya Nair seeded request row (requester parity, third row): title, supplier, and amount, pending a ruling",
  },
  "PH-60": {
    description:
      "Priya's review step identity row and extraction-provenance wording, pending a ruling",
  },
  "PH-61": {
    description:
      "Priya's review step second-card prose wording for vendor, contract, buying entity, cost center, and currency, pending a ruling",
  },
  "PH-62": {
    description:
      "Priya's submitted step: concurrent-group label marking Legal/Security/Privacy Review as running at the same time, pending a ruling",
  },
  "PH-63": {
    description:
      "Priya's submitted step: next-stage state line wording, pending whether it names the stage's own state or names who holds it next, mirroring or diverging from the decision timeline's 'with you now' holder-naming convention, pending a ruling",
  },
  "PH-64": {
    description:
      "Sam's workbench details pane 'what is being bought' section heading, pending a ruling on its wording",
  },
  "PH-65": {
    description:
      "Sam's workbench details pane 'money' section heading, pending a ruling on its wording",
  },
  "PH-66": {
    description:
      "Sam's workbench details pane 'where it charges' section heading, pending a ruling on its wording",
  },
  "PH-67": {
    description:
      "Sam's workbench details pane 'governing' section heading, pending a ruling on its wording",
  },
  "PH-68": {
    description:
      "Elena's outcomes hero headline wording, figure interpolated from the data module, pending a ruling",
    provisional: "Intake quality holds at 82% first time right",
  },
  "PH-69": {
    description:
      "Elena's outcomes hero sub-line wording, figure interpolated from the data module, pending a ruling",
    provisional: "Off contract spend concentrates in software",
  },
  "PH-70": {
    description:
      "Elena's outcomes composer placeholder copy, pending a ruling on its wording",
    provisional: "Ask about any of these figures",
  },
  "PH-71": {
    description:
      "Elena's outcomes stage breakdown card heading, pending a ruling on its wording",
    provisional: "Where the time goes",
  },
  "PH-72": {
    description:
      "Elena's outcomes page header time range control, unwired pending a ruling on its behaviour",
    provisional: "This quarter",
  },
  "PH-73": {
    description:
      "Elena's outcomes page header primary action, unwired pending a ruling on its behaviour",
    provisional: "Export",
  },
  "PH-74": {
    description:
      "Elena's outcomes page header badge text, pending a ruling on its wording",
  },
  "PH-75": {
    description:
      "Elena's outcomes composer first suggestion chip, pending a ruling on its wording",
  },
  "PH-76": {
    description:
      "Elena's outcomes composer second suggestion chip, pending a ruling on its wording",
  },
} as const;

export type PlaceholderId = keyof typeof PLACEHOLDERS;

// Not every entry above declares `provisional`, so a lookup typed against
// this shared shape (rather than each entry's own narrower inferred type)
// is what lets `ph()` read `.provisional` across any id.
interface PlaceholderEntry {
  description: string;
  provisional?: string | Record<string, string>;
}

// Dev-only, off by default, unreachable from any in-app control (prompt
// 55): flips only when someone starts the app with this env var set (e.g.
// a local .env.local, never present in a deployed or demo build), and
// never in a production build regardless.
const REVEAL_PROVISIONAL =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_REVEAL_PLACEHOLDERS === "1";

// Same text, minimally marked, so a provisional string stays legible but
// obviously unruled. `ph()` must keep returning a plain string (many call
// sites feed a strictly `string`-typed data field, not JSX directly), so
// a CSS-based wrapper isn't available here; guillemets add just the two
// characters and don't collide with this app's own punctuation (`·`,
// parentheses).
function markProvisional(text: string): string {
  return `‹${text}›`;
}

/**
 * Renders a placeholder in place of the thing it stands for. A registered
 * provisional value (prompt 55) renders by default, in reveal mode marked
 * per `markProvisional`. With no provisional value: no label renders the
 * full ruling description from the register, for call sites that render
 * it as its own block of explanatory text; a label renders the id plus
 * that short label instead, one line, for a placeholder occupying the
 * position and shape of a label, a link, or an affordance (prompt 41).
 * The register keeps the full description either way, this only changes
 * what's shown on screen.
 */
export const ph = (id: PlaceholderId, label?: string): string => {
  const entry: PlaceholderEntry = PLACEHOLDERS[id];
  let provisional: string | undefined;
  if (typeof entry.provisional === "string") {
    provisional = entry.provisional;
  } else if (label != null) {
    provisional = entry.provisional?.[label];
  }
  if (provisional != null) {
    return REVEAL_PROVISIONAL ? markProvisional(provisional) : provisional;
  }
  return `[${id} ${label ?? entry.description}]`;
};

// ── Timeline anchoring ──────────────────────────────────────────────────────
// Relative sequence across the J3 timeline (req-10482.ts) is fixed; the
// absolute calendar it lands on is not (PH-01). Every date in that module
// derives from this one anchor, so resolving PH-01 is a one-line edit here
// instead of a rewrite of the timeline.

const DAY_MS = 24 * 60 * 60 * 1000;

// PH-01
export const TIMELINE_ANCHOR = new Date("2026-07-24T00:00:00Z");

/** D1: the day the request is uploaded, corrected, submitted, and approved. */
export const D1 = TIMELINE_ANCHOR;

/** D2: fixed at D1 + 1 day, the day the contract executes. */
export const D2 = new Date(D1.getTime() + DAY_MS);

/** Offset in days from D1 to D3 (the activation date). The distance itself
 * is unresolved, not only the calendar it lands on, hence a named constant
 * rather than a literal folded into D3 below.
 * PH-01 */
export const D3_OFFSET_DAYS = 7;

/** D3: the activation date, provisionally D1 + D3_OFFSET_DAYS. */
export const D3 = new Date(D1.getTime() + D3_OFFSET_DAYS * DAY_MS);

const ANCHORED_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "MMM D, YYYY" for an anchor-based date (D1/D2/D3, or any TIMELINE
 * event's own `when`), read in UTC rather than the runtime's local zone
 * (Chunk C2, "one formatter in one zone"). Every one of these dates is
 * built with `setUTCHours` (see `atTime` below), so a local-time read
 * (`getMonth`/`getDate`/`getFullYear`) renders whatever calendar day that
 * UTC instant happens to fall on wherever the code runs, not the day this
 * module encodes — on a host west of UTC, D1 (2026-07-24T00:00Z) reads as
 * Jul 23. This is the one formatter every anchor-based date should render
 * through, not a local `Date` getter reimplemented per call site (the bug
 * this chunk exists to fix). Distinct from `requests/data.ts`'s own
 * `formatDateDisplay`, which stays local-time on purpose: it also formats
 * a live `new Date()` "today" stamp in the running Buy flow, which must
 * read as the viewer's own calendar day, not UTC's. */
export function formatAnchoredDate(date: Date): string {
  const mmm = ANCHORED_MONTHS_SHORT[date.getUTCMonth()];
  return `${mmm} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** "h:mm AM/PM" for an anchor-based time, UTC for the same reason
 * `formatAnchoredDate` is. The pair of these two functions is the "one
 * formatter, one zone" this chunk asks for, one home for both, so every
 * consumer of an anchored date/time reads through the same code instead
 * of each rebuilding its own (see the report on requests/data.ts and
 * workbench/data.ts, which independently had the same bug before this). */
export function formatAnchoredTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** An instant on `day` at a given 24h "HH:MM" wall time (UTC, matching
 * TIMELINE_ANCHOR). Used to place time-stamped timeline events on D1/D2
 * without scattering date literals through req-10482.ts. */
export function atTime(day: Date, hhmm: string): Date {
  const parts = hhmm.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const result = new Date(day);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
}
