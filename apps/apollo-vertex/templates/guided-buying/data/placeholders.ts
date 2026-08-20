// J3's open-question register. Each entry names something pending a ruling
// from product or design. Referencing ph("PH-0x") keeps the gap visible in
// the running prototype and greppable in the source, instead of a
// plausible-looking value standing in for a decision nobody made.

export const PLACEHOLDERS = {
  "PH-01": "absolute date timeline",
  "PH-03": "v2 file size",
  "PH-07":
    "Dana Kim role reuse, and whether Dana L. on REQ-10471 is the same person",
  "PH-08": "DocuSign labelling at V2",
  "PH-10": "composer placeholder for Priya",
  "PH-11": "reworded copy pending confirmation, tagged inline where used",
  "PH-12": "payment terms assistant note",
  "PH-13a": "vendor recommendation headline wording",
  "PH-13b": "vendor recommendation rationale wording",
  "PH-13c": "vendor recommendation basis line wording",
  "PH-14": "vendor step footer affordance copy",
  "PH-15a": "data and info step heading",
  "PH-15b": "data and info step sub-line",
  "PH-19a":
    "review step heading naming the approver and the procurement-then-approval routing (Priya's case: procurement review required before Dana Kim decides), pending Gabriel's wording ruling",
  "PH-19b":
    "review step sub-line stating the procurement-review requirement before the named approver decides, pending Gabriel's wording ruling",
  "PH-20": "review policy check banner content",
  "PH-21a": "submitted state heading",
  "PH-21b": "submitted state routing sub-line",
  "PH-22": "submitted state waiting note",
  "PH-23": "bare flow route composer footnote",
  "PH-24a": "MeetHub vendor comparison content",
  "PH-24b": "Vantage AV vendor comparison content",
  "PH-25": "Q1 consequence line when answered no",
  "PH-26": "REQ-10482 queue card due time",
  "PH-27": "REQ-10482 Workbench detail finding tag",
  "PH-28": "REQ-10482 Workbench detail finding headline",
  "PH-29": "REQ-10482 Workbench detail finding body",
  "PH-30": "REQ-10482 Workbench detail approved confirmation",
  "PH-31": "REQ-10482 Workbench detail countered confirmation",
  "PH-32": "REQ-10482 Workbench detail rejected confirmation",
  "PH-33": "REQ-10482 Workbench detail source document preview lines",
  "PH-34":
    "REQ-10482 payment term exception request action, unwired no-op pending a ruling on its behaviour",
  "PH-35":
    "REQ-10482 flag for review action, unwired no-op pending a ruling on its behaviour",
  "PH-36":
    "REQ-10482 Workbench detail note composer placeholder, audience-naming copy pending",
  "PH-37":
    "Workbench header record level disposition (e.g. hold or reassign), unwired no-op pending a ruling on its content",
  "PH-38":
    "Workbench queue empty segment copy, pending a ruling on its wording",
  "PH-40":
    "REQ-10482 share feedback link destination, unwired no-op pending a ruling on its behaviour",
  "PH-41":
    "REQ-10482 Workbench detail agent card label, pending a ruling on its wording",
  "PH-44":
    "REQ-10482 comparable deals row label naming it as the current order, wording pending a ruling",
  "PH-45":
    "REQ-10482 payment terms check column display label, one per typed check value (deviates, governing, consistent), pending a ruling on wording",
  "PH-46":
    "REQ-10482 decision page exceptions-resolved module heading, pending a ruling on its wording",
  "PH-47":
    "REQ-10482 decision page evidence drill-through link label, unwired no-op pending a ruling on its behaviour and destination",
  "PH-48":
    "REQ-10482 decision page order form attachment state note (e.g. corrected and validated), pending a ruling on its wording",
  "PH-49":
    "REQ-10482 budget-remaining detail line wording, shares REQ-2052's own \"$X of $Y remaining\" grammar, which reads as X being what remains rather than what this request draws down; not corrected here since fixing the shared phrasing would also change REQ-2052's own line, pending a ruling",
  "PH-51":
    "REQ-10482 decision page pending-state AI summary sentence wording, cleared/closed-by say the same thing twice, the exception count is a bare numeral, and the sentence is purely retrospective rather than orienting Dana toward the decision in front of her, pending a ruling",
  "PH-52":
    "REQ-10482 P1 downstream track stage label(s) after Dana's decision, must not name the parallel legal and security review (P2, a later chunk), pending a ruling on wording and count",
  "PH-53":
    "REQ-10482 check chip label for the price benchmark check, pending a ruling on wording",
  "PH-54":
    "REQ-10482 check chip label for the contract terms check, pending a ruling on wording",
  "PH-55":
    "REQ-10482 check chip label for the exceptions cleared check, pending a ruling on wording",
  "PH-56":
    "REQ-10482 decision page P2 multi-year commitment module wording, pending a ruling",
  "PH-57":
    "REQ-10482 decision page order form preview stub body content, not a real document render, pending a ruling on wording",
  "PH-58":
    "Priya Nair seeded request row (requester parity, second row): title, supplier, and amount, pending a ruling",
  "PH-59":
    "Priya Nair seeded request row (requester parity, third row): title, supplier, and amount, pending a ruling",
  "PH-60":
    "Priya's review step identity row and extraction-provenance wording, pending a ruling",
  "PH-61":
    "Priya's review step second-card prose wording for vendor, contract, buying entity, cost center, and currency, pending a ruling",
  "PH-62":
    "Priya's submitted step: concurrent-group label marking Legal/Security/Privacy Review as running at the same time, pending a ruling",
  "PH-63":
    "Priya's submitted step: next-stage state line wording, pending whether it names the stage's own state or names who holds it next, mirroring or diverging from the decision timeline's 'with you now' holder-naming convention, pending a ruling",
} as const;

export type PlaceholderId = keyof typeof PLACEHOLDERS;

/**
 * Renders a placeholder in place of the thing it stands for. With no label,
 * this is the full ruling description from the register, for call sites
 * that render it as its own block of explanatory text. With a `label`,
 * this renders the id plus that short label instead, one line, for a
 * placeholder occupying the position and shape of a label, a link, or an
 * affordance (prompt 41): the register keeps the full description either
 * way, this only changes what's shown on screen.
 */
export const ph = (id: PlaceholderId, label?: string): string =>
  `[${id} ${label ?? PLACEHOLDERS[id]}]`;

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
