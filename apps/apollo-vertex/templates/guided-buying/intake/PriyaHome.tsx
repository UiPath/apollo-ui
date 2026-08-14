"use client";

import { useNavigate } from "@tanstack/react-router";
import { ph } from "../data";
import { Home } from "../home/Home";

/**
 * Priya's own landing surface, the same Home component Marcus's product
 * uses, configured for her rather than branched inside it. Her composer's
 * prompt and placeholder are unresolved copy (PH-10), not invented text.
 * J3 is document-led (requireAttachment), so submitting only fires once an
 * attachment is present, and carries straight onto the Details phase of the
 * flow route rather than landing on a second, bare composer.
 */
export function PriyaHome() {
  const navigate = useNavigate();

  return (
    <Home
      placeholder={ph("PH-10")}
      starterSuggestions={[]}
      requestRows={[]}
      showResumeBand={false}
      requireAttachment
      onSubmit={() =>
        void navigate({ to: "/intake", search: { phase: "details" } })
      }
    />
  );
}
