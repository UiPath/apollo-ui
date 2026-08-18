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
  "PH-19a": "review step heading",
  "PH-19b": "review step routing sub-line",
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
  "PH-39":
    "REQ-10482 benchmark evidence detail link destination, unwired no-op pending a ruling on its behaviour",
  "PH-40":
    "REQ-10482 share feedback link destination, unwired no-op pending a ruling on its behaviour",
  "PH-41":
    "REQ-10482 Workbench detail agent card label, pending a ruling on its wording",
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
