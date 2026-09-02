// The generic exception model. An exception is a first class record with its
// own id and status, not a variant of its parent request and not a status
// field on it. That distinction is the whole point: a request can carry more
// than one exception, each resolving independently, by different means, at
// different times. No request type, commodity, or document type appears
// anywhere in this module; every shape describes structure, not what a given
// request happens to be.

import type { PersonId } from "./people";

export type ExceptionStatus = "open" | "active" | "resolved" | "waiting";

/** One labelled value in a finding: what a given source says. Unbounded on
 * purpose, a finding compares two sources or three identically. `role` marks
 * which side governs and which deviates, only where the seed actually says
 * so; a side with no role (e.g. a third source that's merely consistent)
 * renders with neither marking. `subLine` (prompt 38) is optional: only the
 * price exception's sides currently have a composable explanation; the
 * terms exception's sides render without one rather than an invented line.
 * `unit` (prompt 40) is optional too: a smaller, secondary-coloured suffix
 * rendered inline after `value` (e.g. "/licence/yr"). The terms exception's
 * own values (payment terms) have no unit at all. */
export interface FindingSide {
  label: string;
  value: string;
  unit?: string;
  role?: "governing" | "deviating";
  subLine?: string;
}

/** A set of values shown side by side. Two sides is a document-versus-record
 * comparison; three or more is the same shape, unwidened. */
export interface Finding {
  sides: FindingSide[];
}

/**
 * J3 needs exactly two suggestion types, not the branch's full set (see the
 * report):
 * - accept: a person judges the current value correct as is. Resolves the
 *   exception directly; the reasoning lives on the exception's own
 *   `rationale`, never restated on the suggestion.
 * - request_correction: asks an external party to send a corrected version
 *   of a record. Taking this action parks the exception in "waiting"; it
 *   resolves later, separately, when the corrected version arrives.
 * The branch's other eight variants (suggest_po, suggest_tax_code,
 * suggest_account, retry, wait, and the rest) are either accounts-payable
 * concepts or drive mutation/undo machinery this prototype doesn't build.
 */
export type SuggestionType = "accept" | "request_correction";

/** A drafted message asking for a correction. Minimal on purpose: only what
 * a suggestion needs to carry, not a full communication record. `toName` is
 * the recipient's display name, for surfaces that need to say who a parked
 * exception is waiting on without re-deriving a name from an email address. */
export interface DraftMessage {
  to: string;
  toName?: string;
  cc?: string;
  subject: string;
  body: string;
}

export type Suggestion =
  | { type: "accept" }
  | { type: "request_correction"; draft: DraftMessage };

export type ResolvedBy = "person" | "document";

/**
 * Distinguishes resolution by a person from resolution by a document
 * arriving, as a tag rather than something read out of a string. `by` names
 * who or what: a person's id when resolvedBy is "person", a document's own
 * identifying value (e.g. its version) when resolvedBy is "document".
 */
export type ExceptionResolution =
  | { resolvedBy: "person"; by: PersonId; when: Date | string }
  | { resolvedBy: "document"; by: string; when: Date | string };

export interface Exception {
  id: string;
  /** Broad classification, not an accounts-payable taxonomy: what kind of
   * exception this is at the level "commercial" or "operational" already
   * distinguishes, nothing finer is modelled. */
  type: "commercial" | "operational";
  headline: string;
  finding: Finding;
  suggestions: Suggestion[];
  status: ExceptionStatus;
  /** Who is responsible for resolving this exception. */
  owner: PersonId;
  /** Explains an accepted resolution. Lives here, once, so neither a
   * resolution nor a suggestion ever restates it. */
  rationale?: string;
  /** Set once resolved. */
  resolution?: ExceptionResolution;
  /** Set while status is "waiting": who the exception is waiting on. */
  waitingOn?: string;
}

function isOpenStatus(status: ExceptionStatus): boolean {
  return status === "open" || status === "active";
}

/**
 * Currently open exceptions for a request: neither resolved nor waiting.
 * Derives from the exceptions array itself, nothing is passed in or cached.
 */
export function openExceptions(exceptions: Exception[]): Exception[] {
  return exceptions.filter((e) => isOpenStatus(e.status));
}

export interface ExceptionSummary {
  /** The first open exception, or null when nothing is open. */
  lead: Exception | null;
  openCount: number;
  /** Open exceptions behind the lead, for the queue row's overflow badge. */
  extraCount: number;
  waitingCount: number;
  /** Who the first waiting exception is waiting on, or null. */
  waitingOn: string | null;
}

/**
 * The one place that answers which exception to show, how many more are
 * open, and how many are parked waiting. Both the overflow count and a
 * paging position derive from the same array this function reads; neither is
 * passed in separately.
 *
 * One open exception: lead is that exception, extraCount is 0. Zero open
 * exceptions: lead is null, and waitingCount distinguishes nothing pending
 * (waitingCount 0) from nothing open but something waiting on a reply
 * (waitingCount > 0).
 */
export function getExceptionSummary(exceptions: Exception[]): ExceptionSummary {
  const open = openExceptions(exceptions);
  const waiting = exceptions.filter((e) => e.status === "waiting");
  return {
    lead: open[0] ?? null,
    openCount: open.length,
    extraCount: Math.max(0, open.length - 1),
    waitingCount: waiting.length,
    waitingOn: waiting[0]?.waitingOn ?? null,
  };
}
