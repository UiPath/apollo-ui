"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { Bookmark, Info, PanelRightClose } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { AiChatLoading } from "@/registry/ai-chat/components/ai-chat-loading";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { useSidebar } from "@/registry/sidebar/sidebar-provider";
import { P1 } from "../../P1";
import { P2 } from "../../P2";
import { RailDock } from "./RailDock";
import type { CatalogItem } from "./types";

// Deck j1-06: XPS defense — bold numbered lines + price-priority closer.
const XPS_DEFENSE = `**1. Price after EPP**: The X1 Carbon's employee discount brings it to $1,249. The XPS starts lower but its discount is smaller — after EPP, the Carbon wins by $38 per unit.

**2. Spec match**: The Carbon ships 32 GB standard. The XPS is 16 GB; upgrading it to match adds $120 and 5–7 days to delivery.

**3. Same IT image**: Your team's last two laptop orders were ThinkPads — same driver stack, same setup scripts, no re-enrollment.

If price is the priority, the XPS is the closer call. On spec, delivery, and total cost, the Carbon leads.`;

// Deck j1-06: Yoga defense — touch premium + memory shortfall + form factor.
const YOGA_DEFENSE = `**1. Price after EPP**: The X1 Yoga's touchscreen adds $150 to the base price. After EPP, it lands at $1,999 — $150 more than the Carbon for hardware your contractors won't use in field work.

**2. Spec shortfall**: The Yoga ships 16 GB. Your request calls for 32 GB; the Carbon meets it out of the box.

**3. Form factor for the role**: The convertible hinge is built for designers who flip to tablet mode. For event contractors on a clamshell day, it adds weight and hinge wear with no payoff. The Carbon is lighter and lasts longer in laptop-only use.

If touchscreen mobility matters for these contractors, the Yoga is worth a second look. On spec and total cost for this request, the Carbon leads.`;

const DELL_XPS_ID = "dell-xps-14";

// Deck j1-06: P1 correction — scoped to request only, nothing saved.
const P1_CORRECTION =
  "Got it — noted for this request. The X1 Carbon already meets 32 GB, so your picks stay the same. Nothing is saved; it applies to this request only.";

// Deck j1-07: P2 correction text (Bookmark save receipt rendered separately as children).
const P2_CORRECTION = `Your 32 GB minimum is saved. The Yoga (16 GB) doesn't meet it — I've set it aside on the shelf with a "Show anyway" option.`;

type Phase = "thinking" | "response" | "correcting" | "corrected";

function msg(
  id: string,
  role: "user" | "assistant",
  content: string,
): UIMessage {
  return { id, role, parts: [{ type: "text", content }] };
}

interface ShelfDockProps {
  /** The catalog item whose "Why not this?" was triggered — drives the defense copy. */
  subject: CatalogItem;
  onClose: () => void;
  onCorrectionMade: () => void;
}

export function ShelfDock({
  subject,
  onClose,
  onCorrectionMade,
}: ShelfDockProps) {
  const defense = subject.id === DELL_XPS_ID ? XPS_DEFENSE : YOGA_DEFENSE;
  const { open: navOpen, setOpen: setNavOpen } = useSidebar();
  const prevNavOpen = useRef(navOpen);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [correctionInput, setCorrectionInput] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  // Collapse nav on mount, restore on unmount.
  useEffect(() => {
    prevNavOpen.current = navOpen;
    setNavOpen(false);
    return () => {
      setNavOpen(prevNavOpen.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: capture state only at mount

  // Thinking → response after a brief artificial delay.
  useEffect(() => {
    const id = setTimeout(() => setPhase("response"), 1400);
    return () => clearTimeout(id);
  }, []);

  // Correcting → corrected delay.
  useEffect(() => {
    if (phase !== "correcting") return;
    const id = setTimeout(() => setPhase("corrected"), 900);
    return () => clearTimeout(id);
  }, [phase]);

  // Scroll to bottom as content grows.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [phase, correctionText]);

  const handleCorrectionSubmit = () => {
    const text = correctionInput.trim();
    if (!text || phase !== "response") return;
    setCorrectionText(text);
    setCorrectionInput("");
    setPhase("correcting");
    onCorrectionMade();
  };

  const showComposer = phase !== "corrected";

  return (
    <RailDock open width="250px" onExpand={() => {}}>
      <div className="flex h-full w-[250px] flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <AiMark size={18} gradientId="gb-ai-mark" />
            <span
              className="text-sm font-bold leading-none tracking-tight"
              style={{
                backgroundImage: "var(--ai-gradient-text)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AI Assistant
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close assistant"
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        >
          <AiChatMessage
            message={msg("shelf-q", "user", `Why not the ${subject.name}?`)}
            hideActions
          />

          {phase === "thinking" && <AiChatLoading />}

          {phase !== "thinking" && (
            <>
              <AiChatMessage
                message={msg("shelf-a", "assistant", defense)}
                hideActions
              />
              {/* Deck j1-06 follow-up chips */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full px-3 py-1 text-xs"
                >
                  Show the math
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full px-3 py-1 text-xs"
                >
                  Compare all three
                </Button>
              </div>
            </>
          )}

          {correctionText && (
            <AiChatMessage
              message={msg("corr-u", "user", correctionText)}
              hideActions
            />
          )}

          {phase === "correcting" && <AiChatLoading />}

          {phase === "corrected" && (
            <>
              <P1>
                <AiChatMessage
                  message={msg("corr-a-p1", "assistant", P1_CORRECTION)}
                  hideActions
                />
              </P1>
              <P2>
                <AiChatMessage
                  message={msg("corr-a", "assistant", P2_CORRECTION)}
                  hideActions
                >
                  <div className="flex items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                    <Bookmark
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    Saved to Design Contractor spec · preferences updated
                  </div>
                </AiChatMessage>
              </P2>
            </>
          )}
        </div>

        {/* Caveat + composer pinned to bottom */}
        {showComposer && (
          <div className="shrink-0 border-t">
            <p className="flex items-center gap-1.5 px-3 pt-2.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" aria-hidden />
              The output is AI generated. Please review.
            </p>
            <AiChatInput
              value={correctionInput}
              onChange={setCorrectionInput}
              onSubmit={handleCorrectionSubmit}
              onStop={() => {}}
              isLoading={phase === "correcting"}
              hasMessages
              placeholder="Push back or correct the analysis…"
              disabled={phase !== "response"}
            />
          </div>
        )}
      </div>
    </RailDock>
  );
}
