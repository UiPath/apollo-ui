"use client";

import { useNavigate } from "@tanstack/react-router";
import { usePersona } from "../persona-context";
import { REQUEST_DETAILS, REQUEST_ROWS } from "../requests/data";
import { useRequests } from "../requests/requests-context";
import { Home } from "./Home";

/**
 * The /home route's own component, one surface shared by both requester
 * personas (requester parity), each configured rather than branched
 * inside Home itself (see Home.tsx's own doc comment). Both branches pass
 * `requestRows` explicitly, scoped to the active persona: REQUEST_ROWS is
 * now a shared array (requester parity added requesterPersonaId to it), so
 * Marcus's own branch has to filter it too, or Priya's seeded rows would
 * leak into his mini-list via Home's own unfiltered default. The filtered
 * set is identical in content and order to what that default computed
 * before Priya had any rows in the array, so his rendered surface is
 * unaffected even though this call is no longer the bare `<Home />` the
 * route used to make directly.
 */
export function HomeRoute() {
  const { personaId } = usePersona();
  const navigate = useNavigate();
  const { submittedRows } = useRequests();

  const seen = new Set<string>();
  const allRows = [...submittedRows, ...REQUEST_ROWS].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
  const ownRows = allRows.filter((row) => row.requesterPersonaId === personaId);

  if (personaId !== "priya") {
    return <Home requestRows={ownRows} />;
  }

  // The mini-list teaser only ever shows rows with somewhere real to go
  // (see the report: two seeded rows have no REQUEST_DETAILS entry yet,
  // deliberately, rather than inventing a full timeline for them). The
  // full /requests page still lists all of them, chevron omitted on the
  // ones with nothing to open, via its own existing openable check.
  const openableOwnRows = ownRows.filter(
    (row) => REQUEST_DETAILS[row.id] != null,
  );

  return (
    <Home
      requestRows={openableOwnRows}
      // cleanup FIX: this used to read from `ownRows` (all 3 seeded rows,
      // including the two bracketed placeholders with no detail page),
      // while the mini-list/count below read `openableOwnRows` — chip
      // count and "see all N" disagreed. Both now read the same set.
      starterSuggestions={openableOwnRows
        .slice(0, 3)
        .map((row) => ({ label: row.request, value: row.request }))}
      chipsFillComposerOnly
      showResumeBand={false}
      requireAttachment
      onSubmit={() =>
        void navigate({ to: "/intake", search: { phase: "details" } })
      }
    />
  );
}
