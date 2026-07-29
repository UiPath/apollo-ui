"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Info, Server } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { P2 } from "../P2";
import { getDecisionDetail } from "./data";

export function DecisionWindow() {
  const { id } = useParams({ from: "/decision/$id" });
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [comment, setComment] = useState("");

  const detail = getDecisionDetail(id);

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Decision request not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-8">
        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => void navigate({ to: "/requests" })}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Needs your decision · 1 of 1
          </button>
          <span className="ml-auto">
            {id} · submitted {detail.submittedDate}
          </span>
        </div>

        {/* ── Approver identity ─────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
            AC
          </span>
          <span className="text-xs text-muted-foreground">
            Approver view — Alex Chen · Design Director
          </span>
        </div>

        {/* ── Request title ──────────────────────────────────────────── */}
        <div>
          <h1 className="text-[16.5px] font-semibold leading-snug text-foreground">
            {detail.request}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{detail.meta}</p>
        </div>

        {/* ── Line items ─────────────────────────────────────────────── */}
        <Card variant="solid">
          <CardContent className="space-y-1.5 px-4 py-3">
            {detail.lineItems.map((item) => (
              <div
                key={item.description}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.description}
                </span>
                <span className="tabular-nums">{item.amount}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{detail.total}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── P2 Decision packet ─────────────────────────────────────── */}
        <P2>
          <div className="space-y-2">
            {/* Budget impact */}
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span>{detail.packet.budget.label}</span>
                <span>{detail.packet.budget.pct} after approval</span>
              </div>
              <div className="my-1.5 h-1.5 overflow-hidden rounded-full bg-primary/20">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: detail.packet.budget.pct }}
                />
              </div>
              <p className="text-[10.5px] text-primary/80">
                {detail.packet.budget.detail}
              </p>
            </div>

            {/* Device management */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
              <Server
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">
                  {detail.packet.itReview.title}
                </p>
                <p className="mt-0.5 text-[10.5px] text-primary/80">
                  {detail.packet.itReview.detail}
                </p>
              </div>
            </div>

            {/* Caveat — decision packet is AI-generated */}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" aria-hidden />
              The output is AI generated. Please review.
            </p>
          </div>
        </P2>

        {/* ── Requester note ─────────────────────────────────────────── */}
        <Card variant="solid">
          <CardContent className="px-4 py-3.5">
            <p className="text-xs text-muted-foreground">
              {detail.noteAuthor} · on the request
            </p>
            <p className="mt-1 text-sm text-foreground">"{detail.note}"</p>
          </CardContent>
        </Card>

        {/* ── Approved banner ────────────────────────────────────────── */}
        {approved && (
          <div className="flex items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/8 px-4 py-3">
            <CheckCircle2
              className="size-4 shrink-0 text-primary"
              aria-hidden
            />
            <p className="text-sm text-foreground">
              Approved. The system will dispatch the order.
            </p>
          </div>
        )}

        {/* ── Optional comment + actions ─────────────────────────────── */}
        {/* Approve is a no-op — deck j2-14/15 does not specify what the approver  */}
        {/* sees immediately after approval; j2-16 is Marcus's delivery view.       */}
        {!approved && (
          <div className="space-y-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note — optional"
              className="min-h-[64px] resize-none text-sm"
            />
            <TooltipProvider>
              <div className="flex items-center gap-3">
                <Button className="flex-1" onClick={() => setApproved(true)}>
                  Approve
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex flex-1 cursor-not-allowed">
                      <Button
                        variant="outline"
                        className="pointer-events-none w-full"
                        disabled
                      >
                        Send back…
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Not wired in this pass.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed items-center">
                      <span className="pointer-events-none text-xs text-muted-foreground/40">
                        Reject
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Not wired in this pass.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}
