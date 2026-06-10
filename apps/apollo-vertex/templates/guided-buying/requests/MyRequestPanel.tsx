"use client";

import { useNavigate } from "@tanstack/react-router";
import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AutopilotIcon } from "@/registry/ai-chat/components/icons/autopilot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getRequestDetail,
  getRequestRow,
  type RequestStep,
  STATUS_BADGE,
  STATUS_LABEL,
} from "./data";
import { useRequests } from "./requests-context";

/** The read-only status timeline — the requester's mirror of the agent's work. */
function RequestTimeline({ steps }: { steps: RequestStep[] }) {
  return (
    <ol>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const done = step.state === "done";
        return (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  done
                    ? "bg-[#0f7b8a] text-white"
                    : "border-[1.5px] border-[#0f7b8a]",
                )}
              >
                {done && (
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                )}
              </span>
              {!isLast && (
                <span className="my-1 min-h-[18px] w-px flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-5">
              <p
                className={cn(
                  "text-sm leading-tight text-foreground",
                  done ? "font-medium" : "font-semibold",
                )}
              >
                {step.label}
              </p>
              {step.desc && (
                <p className="mt-1 text-xs leading-[1.5] text-muted-foreground">
                  {step.desc}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The panel body for one request — the tracker, plus follow-ups while in-flight. */
function PanelBody({ id }: { id: string }) {
  const navigate = useNavigate();
  const { threads, addNote, urgent, markUrgent } = useRequests();
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const row = getRequestRow(id);
  const detail = getRequestDetail(id);
  if (!row || !detail) return null;

  const notes = threads[id] ?? [];
  const isUrgent = urgent[id] === true;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addNote(id, text);
    setDraft("");
    setComposerOpen(false);
  };

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="truncate">{row.request}</SheetTitle>
        <SheetDescription className="sr-only">
          Status of request {row.id}
        </SheetDescription>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs text-muted-foreground">{row.id}</span>
          <Badge status={STATUS_BADGE[row.status]} variant="secondary">
            {STATUS_LABEL[row.status]}
          </Badge>
          {isUrgent && (
            <Badge status="error" variant="secondary" className="gap-1">
              <TriangleAlert className="size-3" aria-hidden />
              Urgent
            </Badge>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* Lead — the agent's voice, as a banner (not a timeline node), for
            parity across states. The chronological timeline starts at Submitted. */}
        <div className="flex gap-2.5 rounded-lg border bg-muted/40 px-3.5 py-3">
          <AutopilotIcon
            size={16}
            className="mt-0.5 shrink-0 text-[#0f7b8a]"
            aria-hidden
          />
          <p className="text-sm leading-[1.6] text-foreground">
            {detail.agentLine}
          </p>
        </div>

        <RequestTimeline steps={detail.timeline} />

        {detail.inFlight ? (
          // With procurement: nudge it (message / urgent), plus posted notes.
          <div className="space-y-3 border-t border-border pt-5">
            {isUrgent && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                <TriangleAlert
                  className="size-4 shrink-0 text-warning"
                  aria-hidden
                />
                <span className="text-foreground">
                  Marked urgent. Procurement has been notified.
                </span>
              </div>
            )}

            {notes.length > 0 && (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {n.author}
                      </span>{" "}
                      · {n.time}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{n.text}</p>
                  </div>
                ))}
              </div>
            )}

            {composerOpen ? (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message procurement about this request…"
                  className="min-h-[80px] resize-none text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposerOpen(false);
                      setDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" disabled={!draft.trim()} onClick={send}>
                    Send to procurement
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComposerOpen(true)}
                >
                  Message procurement
                </Button>
                {!isUrgent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markUrgent(id)}
                  >
                    Mark urgent
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Terminal (ordered/approved, no procurement): order-shaped verbs.
          <div className="flex flex-wrap gap-2 border-t border-border pt-5">
            <Button size="sm" onClick={() => void navigate({ to: "/buy" })}>
              Reorder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void navigate({ to: "/catalog" })}
            >
              View order
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

interface MyRequestPanelProps {
  id: string | null;
  onClose: () => void;
}

/**
 * The requester's detail as a right-side slide-over off the list — a tracker, not
 * a workspace (the buyer's Workbench keeps the full-page detail). `displayId`
 * holds the last request so its content stays put through the close animation.
 */
export function MyRequestPanel({ id, onClose }: MyRequestPanelProps) {
  const [displayId, setDisplayId] = useState<string | null>(id);

  useEffect(() => {
    if (id) setDisplayId(id);
  }, [id]);

  return (
    <Sheet
      open={id != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {displayId && <PanelBody key={displayId} id={displayId} />}
      </SheetContent>
    </Sheet>
  );
}
