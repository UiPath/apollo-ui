"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getDecisionDetail, getPoDetail, getRequestRow } from "./data";

// Marks body only for the duration of a print started from this record's own
// Print button, so the @media print rule below never fires for a print
// started from anywhere else while this component happens to be mounted.
const PRINTING_CLASS = "printing-po-record";

// The only PO seeded so far belongs to REQ-2052 — a real lookup once more
// than one PO exists, rather than a hardcoded id.
const PO_TO_REQUEST: Record<string, string> = {
  "PO-88421": "REQ-2052",
};

interface PORecordProps {
  id: string;
  /** Rendered inside another surface (the approver's decision page, in a
   * Sheet) instead of at its own /po/$id route — drops the breadcrumb,
   * back-nav, and page-level heading, since the host surface already
   * carries the PO number and its own way back. See PORecordPage below
   * for the standalone route, which still registers and works on its own. */
  embedded?: boolean;
}

export function PORecord({ id, embedded = false }: PORecordProps) {
  const navigate = useNavigate();
  const detail = getPoDetail(id);
  const requestId = PO_TO_REQUEST[id];
  const requestRow = requestId != null ? getRequestRow(requestId) : undefined;
  // The same shipTo the request envelope and the approver's decision page
  // both read, not a third hand-authored copy that can drift out of sync
  // with a changed cost center or ship-to the way this one used to.
  const decisionDetail =
    requestId != null ? getDecisionDetail(requestId) : undefined;
  const shipTo = decisionDetail?.shipTo ?? detail?.shipTo;

  // The class comes off once the print dialog closes (afterprint fires on
  // both print and cancel), and on unmount, so a component removed while
  // the print dialog is still open can't leave it stuck on indefinitely.
  useEffect(() => {
    const clear = () => document.body.classList.remove(PRINTING_CLASS);
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("afterprint", clear);
      clear();
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add(PRINTING_CLASS);
    window.print();
  };

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Purchase order not found.</p>
      </div>
    );
  }

  return (
    <>
      {/*
        Print stylesheet: hide all app chrome and make this record the only
        visible content. The visibility trick works regardless of DOM depth.
        Scoped to body.printing-po-record (see handlePrint above), so a
        print started from any other page while this component happens to
        be mounted isn't hijacked into printing just this record.
      */}
      <style>{`
        @media print {
          body.${PRINTING_CLASS} * { visibility: hidden; }
          body.${PRINTING_CLASS} [data-po-record], body.${PRINTING_CLASS} [data-po-record] * { visibility: visible; }
          body.${PRINTING_CLASS} [data-po-record] { position: fixed; inset: 0; overflow: auto; padding: 2rem; background: white; color: black; }
        }
      `}</style>

      <div className="h-full overflow-y-auto">
        <div
          className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8"
          data-po-record
        >
          {/* ── Breadcrumb ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            {!embedded && requestId != null && (
              <button
                type="button"
                onClick={() =>
                  void navigate({
                    to: "/requests/$id",
                    params: { id: requestId },
                  })
                }
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                {requestRow?.request ?? requestId}
              </button>
            )}
            {!embedded && requestId != null && (
              <span className="text-muted-foreground/40" aria-hidden>
                /
              </span>
            )}
            {!embedded && (
              <h1 className="text-sm font-semibold text-foreground">
                {detail.poNumber}
              </h1>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="size-3.5" aria-hidden />
              Print
            </Button>
          </div>

          {/* ── PO header card ────────────────────────────────────────── */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Purchase Order
                </p>
                <p className="mt-0.5 text-xl font-bold text-foreground">
                  {detail.poNumber}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{detail.poDate}</p>
                <p>Issue date</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  Vendor
                </p>
                <p className="text-sm font-medium text-foreground">
                  {detail.vendor}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {detail.vendorAddress}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  Ship to
                </p>
                <p className="text-sm text-foreground">{shipTo}</p>
              </div>
            </div>
          </div>

          {/* ── Line items ────────────────────────────────────────────── */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Unit price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.lineItems.map((line, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 text-foreground">
                      {line.description}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {line.qty}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {line.unitPrice}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {line.total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/20">
                {[
                  { label: "Subtotal", value: detail.subtotal },
                  { label: "Tax", value: detail.tax },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td
                      colSpan={3}
                      className="px-4 py-2 text-right text-xs text-muted-foreground"
                    >
                      {label}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {value}
                    </td>
                  </tr>
                ))}
                <tr className="border-t">
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-right text-sm font-semibold text-foreground"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                    {detail.total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/** The /po/$id route's own entry point — reads the route param and hands it
 * to PORecord as a plain prop, standalone (not embedded). The route stays
 * registered and working on its own, since the sidebar's Linked records
 * chip on the requester's Request Window still points here directly. */
export function PORecordPage() {
  const { id } = useParams({ from: "/po/$id" });
  return <PORecord id={id} />;
}
