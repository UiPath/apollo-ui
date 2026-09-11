import { useSyncExternalStore } from "react";
import {
  FINDINGS,
  notifyFindings,
  subscribeFindings,
} from "../coe/findings-data";

// Prompt 93: Elena's card and Ravi's CoE queue read the same seeded
// record now, rather than this hook keeping its own module level flag
// (prompt 91's original design). Prompt 94: the shared subscriber set now
// lives in findings-data.ts itself, since Ravi's own detail page also
// mutates this same record (publishing), and both surfaces re-render off
// one notify call rather than two separate listener sets.
const FINDING_ID = "FIND-01";

function getSnapshot() {
  const finding = FINDINGS[FINDING_ID];
  return finding ? `${finding.sentAt ?? ""}|${finding.publishedAt ?? ""}` : "|";
}

// The server never has a send to reflect, so its snapshot is always the
// unsent state; this also keeps first client render and the server render
// in agreement, avoiding a hydration mismatch.
function getServerSnapshot() {
  return "|";
}

/**
 * Whether "where the time goes"'s CoE recommendation (prompt 91) has been
 * sent and, once Ravi publishes it (prompt 94), published, read from the
 * seeded finding record rather than component state or sessionStorage:
 * the same module level value survives this card collapsing and
 * reexpanding and a persona switch, both client side navigations that
 * never reload the module, but resets on an actual page refresh, which
 * does (the ask prompt 93 made explicit).
 *
 * `sentAt`/`publishedAt` are parsed out of the hook's own snapshot string
 * rather than a fresh `FINDINGS[FINDING_ID]` read in the render body: this
 * app builds with the React Compiler (next.config.ts, `reactCompiler:
 * true`), which memoizes a read keyed only on stable module level
 * references (`FINDINGS`, `FINDING_ID`) as pure, and never invalidates
 * it, since it can't see that `FINDINGS[FINDING_ID]`'s own fields mutate
 * in place. Deriving the values from `useSyncExternalStore`'s own return
 * value keeps the read inside the one expression the compiler already
 * knows can't be cached across renders (reproduced live: without this,
 * clicking "Send to CoE" mutated the record correctly but the card kept
 * rendering its pre send content).
 */
export function useRecommendationSent() {
  const snapshot = useSyncExternalStore(
    subscribeFindings,
    getSnapshot,
    getServerSnapshot,
  );
  const [sentAt, publishedAt] = snapshot.split("|");

  return {
    sentAt: sentAt || null,
    publishedAt: publishedAt || null,
    send: () => {
      const finding = FINDINGS[FINDING_ID];
      if (finding) finding.sentAt = new Date().toISOString();
      notifyFindings();
    },
  };
}
