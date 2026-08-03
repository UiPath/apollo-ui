"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import type { SupplierEmailDraft } from "./invoice-review-data";

// Recommendation-tier AI refinement actions, ported from v1. Inert stubs (v1
// wired them to nothing): the seam is left as-is, ready for a real rewrite call.
const AI_REWRITES = [
  "Make formal",
  "Make concise",
  "Add detail",
  "Simplify",
] as const;

/**
 * The supplier email draft modal, ported from the v1 prototype's EmailPanelTab
 * into a prop-driven component (v1 read invoice data from context; this takes the
 * prefilled draft as props so the next/ routing flow owns it). It is the
 * confirmation step for a supplier route: Send commits the park (via onSend);
 * Discard / Esc / X leave the exception fully live and untouched (onDiscard).
 *
 * Mounted only while open, so each open gets a fresh draft. Radix Dialog provides
 * the focus trap, Esc-to-close, and the close (X) button; initial focus is moved
 * to the body (the thing to review). Reduced motion skips the send animation.
 */
export function SupplierEmailModal({
  open,
  vendor,
  initial,
  reducedMotion,
  onSend,
  onDiscard,
}: {
  open: boolean;
  vendor: string;
  initial: { to: string; subject: string; body: string };
  reducedMotion: boolean;
  onSend: (draft: SupplierEmailDraft) => void;
  onDiscard: () => void;
}) {
  const [to, setTo] = useState(initial.to);
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [sendPhase, setSendPhase] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const markGradientId = useId();
  const busy = sendPhase !== "idle";
  // The body is focused programmatically on open; text fields still match
  // :focus-visible on programmatic focus, so gate the ring on a real interaction
  // (keydown / pointer) to keep the open state ring-free with just its border.
  const [ringArmed, setRingArmed] = useState(false);
  const [bodyEdited, setBodyEdited] = useState(false);

  function buildDraft(): SupplierEmailDraft {
    return { to, cc: cc.trim() || undefined, subject, body };
  }

  function handleSendClick() {
    // Reduced motion: commit immediately, no sending -> sent beats.
    if (reducedMotion) {
      onSend(buildDraft());
      return;
    }
    setSendPhase("sending");
    setTimeout(() => {
      setSendPhase("sent");
      setTimeout(() => onSend(buildDraft()), 500);
    }, 600);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) onDiscard();
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          bodyRef.current?.focus();
        }}
        className="flex h-[600px] max-w-2xl flex-col overflow-hidden !p-0 motion-reduce:animate-none"
      >
        {/* Gradient def so the provenance mark paints with the strong AI gradient. */}
        <svg width={0} height={0} aria-hidden="true" className="absolute">
          <defs>
            <linearGradient
              id={markGradientId}
              x1="2"
              y1="4"
              x2="22"
              y2="20"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="var(--ai-gradient-start)" />
              <stop offset="1" stopColor="var(--ai-gradient-end)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-1 flex-col overflow-hidden bg-card">
          {/* Header. DialogTitle is the visible title (aria-labelledby); the
              description combines the AI provenance disclaimer with the review
              prompt on one line. */}
          <div className="shrink-0 px-4 pt-4 pb-3">
            <DialogTitle>Email to {vendor}</DialogTitle>
            <DialogDescription className="mt-0.5 flex items-center gap-1.5">
              <AiMark size={12} gradientId={markGradientId} />
              <span>
                {bodyEdited
                  ? "Drafted by AI · edited"
                  : "Drafted by AI from invoice data"}
                . Review before sending.
              </span>
            </DialogDescription>
          </div>
          <Separator />

          {/* Fields */}
          <div className="shrink-0 space-y-2 border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                To
              </span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  + CC
                </button>
              )}
            </div>
            {showCc && (
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">
                  CC
                </span>
                <input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Add CC…"
                  className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                Subject
              </span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* AI refinement chips: recommendation-tier, ai-outline badge style
                (the gradient outline is the AI mark; no separate icon). Inert
                stubs, wired to nothing yet. */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-muted/20 px-4 py-2">
            {AI_REWRITES.map((action) => (
              <Badge key={action} asChild status="ai" variant="outline">
                <button
                  type="button"
                  className="cursor-pointer hover:opacity-90"
                >
                  {action}
                </button>
              </Badge>
            ))}
          </div>

          {/* Body — the thing to review, given initial focus. Quiet resting
                border; accent ring only on real (keyboard/pointer) focus, never
                on the programmatic open focus. */}
          <div className="flex flex-1 flex-col overflow-hidden p-3">
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setBodyEdited(true);
              }}
              onKeyDown={() => setRingArmed(true)}
              onPointerDown={() => setRingArmed(true)}
              className={cn(
                "custom-scrollbar w-full flex-1 resize-none rounded-lg border-[0.5px] border-border bg-card p-3 text-xs leading-relaxed focus:outline-none",
                ringArmed && "focus-visible:ring-1 focus-visible:ring-ring",
              )}
            />
          </div>

          {/* Footer: Send primary, Discard quiet; both disabled while sending. */}
          <div
            className="flex shrink-0 items-center justify-end gap-2 px-4"
            style={{ height: "80px" }}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onDiscard}
            >
              Discard
            </Button>
            <Button
              variant={sendPhase === "sent" ? "success" : "ai"}
              size="sm"
              disabled={busy}
              onClick={handleSendClick}
            >
              {sendPhase === "idle" && <Send className="size-3.5" />}
              {sendPhase === "sending" && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              {sendPhase === "sent" && <Check className="size-3.5" />}
              {sendPhase === "idle" && "Send Email"}
              {sendPhase === "sending" && "Sending…"}
              {sendPhase === "sent" && "Sent!"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
