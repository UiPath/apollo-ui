"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Link as LinkIcon,
  Package,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JourneyBar } from "../JourneyBar";
import { getCloseDetail } from "./data";

export function CloseWindow() {
  const { id } = useParams({ from: "/close/$id" });
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  const detail = getCloseDetail(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-8">
        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void navigate({ to: "/requests/$id", params: { id } })
            }
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Requests
          </button>
          <span className="text-muted-foreground/40" aria-hidden>
            /
          </span>
          <h1 className="text-sm font-semibold text-foreground">
            {detail.request}
          </h1>
          <Badge status="success" variant="secondary" className="text-[10.5px]">
            Delivered
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {id} · received {detail.receivedDate}
          </span>
        </div>

        {/* ── Journey card — all stages done ────────────────────────── */}
        <div className="rounded-xl border bg-card px-4 py-3.5">
          <JourneyBar
            stages={detail.stages}
            recordChips={
              <div className="flex flex-wrap gap-1.5">
                {detail.recordChips.map((chip) => {
                  const isPo = chip.startsWith("PO-");
                  return isPo ? (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        void navigate({ to: "/po/$id", params: { id: chip } })
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <LinkIcon className="size-3 shrink-0" aria-hidden />
                      {chip}
                    </button>
                  ) : (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary"
                    >
                      <LinkIcon className="size-3 shrink-0" aria-hidden />
                      {chip}
                    </span>
                  );
                })}
              </div>
            }
          />
        </div>

        {/* ── Delivery summary ──────────────────────────────────────── */}
        <Card variant="solid">
          <CardContent className="flex items-start gap-3 px-4 py-3.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Package className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {detail.summary.heading}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {detail.summary.detail}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Confirmed banner ──────────────────────────────────────── */}
        {confirmed && (
          <div className="flex items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/8 px-4 py-3">
            <CheckCircle2
              className="size-4 shrink-0 text-primary"
              aria-hidden
            />
            <p className="text-sm text-foreground">{detail.banner}</p>
          </div>
        )}

        {/* ── Action ────────────────────────────────────────────────── */}
        {!confirmed && (
          <Button className="w-full" onClick={() => setConfirmed(true)}>
            {detail.action}
          </Button>
        )}
      </div>
    </div>
  );
}
