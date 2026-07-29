"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPoDetail } from "./data";

export function PORecord() {
  const { id } = useParams({ from: "/po/$id" });
  const navigate = useNavigate();
  const detail = getPoDetail(id);

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
      */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-po-record], [data-po-record] * { visibility: visible; }
          [data-po-record] { position: fixed; inset: 0; overflow: auto; padding: 2rem; background: white; color: black; }
        }
      `}</style>

      <div className="h-full overflow-y-auto">
        <div
          className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8"
          data-po-record
        >
          {/* ── Breadcrumb ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void navigate({ to: "/close/$id", params: { id: "REQ-2052" } })
              }
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Delivery
            </button>
            <span className="text-muted-foreground/40" aria-hidden>
              /
            </span>
            <h1 className="text-sm font-semibold text-foreground">
              {detail.poNumber}
            </h1>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => window.print()}
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
                <p className="text-sm text-foreground">{detail.shipTo}</p>
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
