import { ANALYTICS_SCOPE } from "../data/analytics";
import { PEOPLE } from "../data/people";
import { ph } from "../data/placeholders";

export interface Finding {
  id: string;
  /** Absent for a finding that hasn't been written yet, the same
   * absent-means-no-render rule prompt 90 set for `askAnswer`; the row
   * this backs does not render at all. */
  text?: string;
  raisedAt: string;
  raisedBy: string;
  sourceSurface: string;
  sourceCard: string;
  /** Null until Elena's own send marks it; the record's own field is the
   * single source of truth her card and this queue both read. */
  sentAt: string | null;
  /** Prompt 94: null until Ravi's own publish marks it, on the same
   * record, the same convention `sentAt` already set (prompt 93). */
  publishedAt: string | null;
}

// Prompt 93: seeded, not created on send, the same record correctness
// convention already recorded for the Teams chunk (requests/
// RequestsProvider.tsx's INITIAL_THREADS: seed the record once, let every
// surface that shows it read the one object, so it's correct whether or
// not a live action happened this session, and correct again on return).
// Elena's outcomes card and Ravi's CoE queue both read this one record;
// sending flips `sentAt` in place rather than creating a new one.
export const FINDINGS: Record<string, Finding> = {
  "FIND-01": {
    id: "FIND-01",
    text: ph("PH-104", "where the time goes recommendation"),
    raisedAt: ANALYTICS_SCOPE.period,
    raisedBy: PEOPLE["elena-vasquez"].name,
    sourceSurface: "Procurement outcomes",
    sourceCard: ph("PH-80", "where the time goes"),
    sentAt: null,
    publishedAt: null,
  },
  // Section 7: the deck implies a second finding; PH-112 names the gap
  // without authoring content for it. `text` stays unset on purpose, not
  // called via ph() here, since ph() always returns a string (bracketed
  // when unset) and this record needs a genuinely absent value for the
  // queue's own presence check to skip the row.
  "FIND-02": {
    id: "FIND-02",
    raisedAt: ANALYTICS_SCOPE.period,
    raisedBy: PEOPLE["elena-vasquez"].name,
    sourceSurface: "Procurement outcomes",
    sourceCard: ph("PH-80", "where the time goes"),
    sentAt: null,
    publishedAt: null,
  },
};

// Prompt 94: one subscriber set for the whole record, so Elena's card and
// Ravi's own detail page (two different components mutating and reading
// the same FINDINGS object) can each re-render off a single notify call,
// rather than each keeping its own separate listener set for the one
// shared record.
const listeners = new Set<() => void>();

export function subscribeFindings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyFindings(): void {
  for (const listener of listeners) listener();
}
