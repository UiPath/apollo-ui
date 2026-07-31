"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  CircleCheck,
  Info,
  PanelLeftClose,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { AiChatLoading } from "@/registry/ai-chat/components/ai-chat-loading";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { P1 } from "../../P1";
import { P2 } from "../../P2";
import {
  type ThreadStep,
  useAssistantThread,
} from "./assistant-thread-context";
import { RailDock } from "./RailDock";
import type { CatalogItem } from "./types";

// Deck j1-06: XPS defense — bold numbered lines + price-priority closer.
const XPS_DEFENSE = `**1. Price after EPP**: The X1 Carbon's employee discount brings it to $1,249. The XPS starts lower but its discount is smaller. After EPP, the Carbon wins by $38 per unit.

**2. Spec match**: The Carbon ships 32 GB standard. The XPS is 16 GB; upgrading it to match adds $120 and 5–7 days to delivery.

**3. Same IT image**: Your team's last two laptop orders were ThinkPads, same driver stack, same setup scripts, no re-enrollment.

If price is the priority, the XPS is the closer call. On spec, delivery, and total cost, the Carbon leads.`;

// Deck j1-06: Yoga defense — touch premium + memory shortfall + form factor.
const YOGA_DEFENSE = `**1. Price after EPP**: The X1 Yoga's touchscreen adds $150 to the base price. After EPP, it lands at $1,999, $150 more than the Carbon for hardware your contractors won't use in field work.

**2. Spec shortfall**: The Yoga ships 16 GB. Your request calls for 32 GB; the Carbon meets it out of the box.

**3. Form factor for the role**: The convertible hinge is built for designers who flip to tablet mode. For event contractors on a clamshell day, it adds weight and hinge wear with no payoff. The Carbon is lighter and lasts longer in laptop-only use.

If touchscreen mobility matters for these contractors, the Yoga is worth a second look. On spec and total cost for this request, the Carbon leads.`;

const DELL_XPS_ID = "dell-xps-14";

// Deck j1-06: dock response body drops to text-sm; bold labels stay legible.
const RESPONSE_MARKDOWN_CLASSNAME =
  "py-1 text-sm leading-relaxed bg-transparent text-foreground prose dark:prose-invert max-w-none";

// Deck j1-06: P1 correction — scoped to request only, nothing saved.
const P1_CORRECTION =
  "Got it, noted for this request. The X1 Carbon already meets 32 GB, so your picks stay the same. Nothing is saved; it applies to this request only.";

// Deck j1-07: P2 correction text (Bookmark save receipt rendered separately as children).
const P2_CORRECTION = `Your 32 GB minimum is saved. The Yoga (16 GB) doesn't meet it. I've set it aside on the shelf with a "Show anyway" option.`;

// Opened generically (header ✦, or the Shelf's "not finding what you're
// looking for?") — no specific item to defend, just an open thread. The panel
// never opens empty: this is what the agent has already done on this request.
const GENERIC_ACK = "Got it, noted for this request.";

type GenericContext = "bridge" | "selection" | "review";

// Step-aware starter prompts, shown above the composer until the first message.
const SUGGESTED_QUESTIONS: Record<GenericContext, string[]> = {
  bridge: [
    "Why Design Operations?",
    "Who approves this?",
    "Can I change the ship-to?",
  ],
  selection: [
    "How does the XPS compare?",
    "Why not the Yoga?",
    "What if I need touch?",
  ],
  review: [
    "When will this be approved?",
    "What's the policy on rush orders?",
    "Can I still edit the cart?",
  ],
};

// Matches FlowPhaseBar's CATALOG_PHASES labels.
const STEP_LABELS: Record<ThreadStep, string> = {
  details: "Details",
  choose: "Choose",
  review: "Review",
  done: "Done",
};

type Phase = "thinking" | "response" | "correcting" | "corrected";

function msg(
  id: string,
  role: "user" | "assistant",
  content: string,
): UIMessage {
  return { id, role, parts: [{ type: "text", content }] };
}

interface ShelfDockProps {
  /** The catalog item whose "Why not this?" was triggered — drives the defense
   * copy. Null when opened generically: the activity summary + an open
   * thread, no scripted defense. */
  subject: CatalogItem | null;
  /** Which step the panel was opened from — drives the generic mode's
   * step-aware starter prompts. Ignored when `subject` is set. */
  context?: GenericContext;
  onClose: () => void;
  onCorrectionMade: () => void;
}

export function ShelfDock({
  subject,
  context = "selection",
  onClose,
  onCorrectionMade,
}: ShelfDockProps) {
  const reduceMotion = useReducedMotion();
  const { entries, currentStep, addQaEntry } = useAssistantThread();
  const defense = subject
    ? subject.id === DELL_XPS_ID
      ? XPS_DEFENSE
      : YOGA_DEFENSE
    : "";
  const [phase, setPhase] = useState<Phase>("thinking");
  const [correctionInput, setCorrectionInput] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  // A question waits here while the canned ack "thinks", then lands in the
  // shared thread — so the delay reads the same as the rest of the app.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [genericInput, setGenericInput] = useState("");
  // Earlier step entries condense by default; a user can reopen one.
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(
    () => new Set(),
  );
  const bodyRef = useRef<HTMLDivElement>(null);

  // Thinking → response after a brief artificial delay. Scripted mode only.
  useEffect(() => {
    if (!subject) return;
    const id = setTimeout(() => setPhase("response"), 1400);
    return () => clearTimeout(id);
  }, [subject]);

  // Correcting → corrected delay.
  useEffect(() => {
    if (phase !== "correcting") return;
    const id = setTimeout(() => setPhase("corrected"), 900);
    return () => clearTimeout(id);
  }, [phase]);

  // Generic mode: brief "thinking" delay before the canned acknowledgement
  // lands in the shared thread.
  useEffect(() => {
    if (!pendingQuestion) return;
    const question = pendingQuestion;
    const id = setTimeout(() => {
      addQaEntry(question, GENERIC_ACK);
      setPendingQuestion(null);
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  // Scroll to bottom as content grows.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [phase, correctionText, entries, pendingQuestion]);

  const handleCorrectionSubmit = () => {
    const text = correctionInput.trim();
    if (!text || phase !== "response") return;
    setCorrectionText(text);
    setCorrectionInput("");
    setPhase("correcting");
    onCorrectionMade();
  };

  // Shared by the composer submit and the "Try asking" chips.
  const sendGenericMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pendingQuestion) return;
    setPendingQuestion(trimmed);
    setGenericInput("");
  };

  const toggleExpanded = (id: string) => {
    setManuallyExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenericSubmit = () => sendGenericMessage(genericInput);

  const showComposer = subject ? phase !== "corrected" : true;
  // Starter prompts step aside once the thread has any Q&A of its own.
  const hasQa = entries.some((e) => e.kind === "qa");
  const showSuggestions = !subject && !hasQa && !pendingQuestion;

  return (
    <RailDock open width="380px" onExpand={() => {}}>
      <div className="relative h-full w-[380px]">
        {/* Ambient glow, cropped and bleeding off the panel's top-left
            corner — clipped by RailDock's own overflow-hidden <aside>.
            --ai-gradient (not the static -start/-end pair) has its own
            light/dark definitions, so it stays correctly tuned in dark mode
            instead of the same vivid hex values reading too hot on navy.
            The explicit dark:opacity-20 cancels AiGlow's own baked-in
            dark:opacity-60. */}
        <AiGlow
          className="-top-64 -left-64 size-[36rem] opacity-20 blur-3xl dark:opacity-20"
          style={{ backgroundImage: "var(--ai-gradient)" }}
        />
        <div className="relative flex h-full min-h-0 flex-col">
          {/* Header — h-12 matches the page header so the borders line up.
              Solid background so the glow behind it doesn't bleed through. */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-2">
              <svg width={0} height={0} aria-hidden className="absolute">
                <defs>
                  <linearGradient
                    id="shelf-dock-ai-mark"
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
              <AiMark size={20} gradientId="shelf-dock-ai-mark" />
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
              <PanelLeftClose className="size-4" />
            </Button>
          </div>

          {/* Body — scrolls independently so the composer stays pinned + visible.
            Bottom edge fades via mask instead of a hard border into the composer. */}
          <div
            ref={bodyRef}
            className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)]"
          >
            {subject ? (
              <>
                <AiChatMessage
                  message={msg(
                    "shelf-q",
                    "user",
                    `Why not the ${subject.name}?`,
                  )}
                  hideActions
                />

                {phase === "thinking" && <AiChatLoading />}

                {phase !== "thinking" && (
                  <>
                    <AiChatMessage
                      message={msg("shelf-a", "assistant", defense)}
                      hideActions
                      assistantMarkdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
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
                        assistantMarkdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
                      />
                    </P1>
                    <P2>
                      <AiChatMessage
                        message={msg("corr-a", "assistant", P2_CORRECTION)}
                        hideActions
                        assistantMarkdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
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
              </>
            ) : (
              <motion.div
                className="space-y-5"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: reduceMotion ? 0 : 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {entries.map((entry) => {
                  if (entry.kind === "qa") {
                    return (
                      <div key={entry.id} className="space-y-3">
                        <AiChatMessage
                          message={msg(`${entry.id}-q`, "user", entry.question)}
                          hideActions
                        />
                        <AiChatMessage
                          message={msg(
                            `${entry.id}-a`,
                            "assistant",
                            entry.answer,
                          )}
                          hideActions
                          assistantMarkdownClassName={
                            RESPONSE_MARKDOWN_CLASSNAME
                          }
                        />
                      </div>
                    );
                  }
                  const isCurrent = entry.step === currentStep;
                  const isOpen = isCurrent || manuallyExpanded.has(entry.id);
                  return (
                    <div key={entry.id}>
                      {isCurrent ? (
                        <p className="text-xs text-muted-foreground">
                          {STEP_LABELS[entry.step]} · {entry.time}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(entry.id)}
                          className="flex w-full items-center gap-2 text-left"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {STEP_LABELS[entry.step]}:
                            </span>{" "}
                            {entry.summary}
                          </span>
                          <ChevronDown
                            className={cn(
                              "size-3.5 shrink-0 text-muted-foreground transition-transform",
                              isOpen && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                      )}
                      {isCurrent && (
                        <p className="mt-0.5 text-sm font-semibold text-foreground">
                          {entry.summary}
                        </p>
                      )}
                      {isOpen &&
                        (entry.fields && entry.fields.length > 0 ? (
                          <div
                            className={cn(
                              "space-y-3",
                              isCurrent ? "mt-3" : "mt-3 pl-1",
                            )}
                          >
                            {/* Assumed first: the one low-confidence guess,
                                called out with a warning tone instead of
                                blending into the check-marked records below. */}
                            {entry.fields
                              .filter((f) => f.assumed)
                              .map((f) => (
                                <div
                                  key={f.label}
                                  className="flex items-start gap-2.5 rounded-lg bg-warning/15 p-3 dark:bg-warning/25"
                                >
                                  <TriangleAlert
                                    className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning"
                                    aria-hidden
                                  />
                                  {/* Hanging indent: the content div wraps
                                      within its own box, so a second line
                                      lands under the value, not the icon. */}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm text-foreground">
                                      {f.value}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {f.label} · {f.source}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            {entry.fields.some((f) => !f.assumed) && (
                              <div className="space-y-[11px]">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Straight from your records
                                </p>
                                {entry.fields
                                  .filter((f) => !f.assumed)
                                  .map((f) => (
                                    <div
                                      key={f.label}
                                      className="flex items-start gap-2.5"
                                    >
                                      <CircleCheck
                                        className="mt-0.5 size-3.5 shrink-0 text-(--primary)"
                                        aria-hidden
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm text-foreground">
                                          {f.value}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                          {f.label} · {f.source}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "space-y-1.5",
                              isCurrent ? "mt-2" : "mt-2 pl-1",
                            )}
                          >
                            {entry.detail.map((line) => (
                              <div
                                key={line}
                                className="flex items-start gap-2"
                              >
                                <CircleCheck
                                  className="mt-0.5 size-3.5 shrink-0 text-(--primary)"
                                  aria-hidden
                                />
                                <p className="text-xs text-muted-foreground">
                                  {line}
                                </p>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  );
                })}

                {pendingQuestion && (
                  <div className="space-y-3">
                    <AiChatMessage
                      message={msg("pending-q", "user", pendingQuestion)}
                      hideActions
                    />
                    <AiChatLoading />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Composer + caveat pinned to bottom — same 24px inset as the panel. */}
          {showComposer && (
            <div className="shrink-0 px-6 pt-4 pb-6">
              {showSuggestions && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS[context].map((question) => (
                      <button
                        key={question}
                        type="button"
                        className="rounded-full border px-3 py-1 text-xs text-foreground hover:bg-muted"
                        onClick={() => sendGenericMessage(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {subject ? (
                <AiChatInput
                  value={correctionInput}
                  onChange={setCorrectionInput}
                  onSubmit={handleCorrectionSubmit}
                  onStop={() => {}}
                  isLoading={phase === "correcting"}
                  hasMessages
                  embedded
                  placeholder="Push back or correct the analysis…"
                  disabled={phase !== "response"}
                />
              ) : (
                <AiChatInput
                  value={genericInput}
                  onChange={setGenericInput}
                  onSubmit={handleGenericSubmit}
                  onStop={() => {}}
                  isLoading={pendingQuestion !== null}
                  hasMessages
                  embedded
                  placeholder="Ask a question…"
                  disabled={pendingQuestion !== null}
                />
              )}
              <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" aria-hidden />
                The output is AI generated. Please review.
              </p>
            </div>
          )}
        </div>
      </div>
    </RailDock>
  );
}
