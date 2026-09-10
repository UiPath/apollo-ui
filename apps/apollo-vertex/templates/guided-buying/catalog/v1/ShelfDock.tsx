"use client";

// oxlint-disable max-lines -- the dock's scripted defense/correction flow,
// the generic Q&A thread, and the step timeline all read the same
// AssistantThreadProvider state and stayed together deliberately (see the
// report); already over on its own before prompt 45's block rendering.

import type { UIMessage } from "@tanstack/ai-client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  CircleCheck,
  Info,
  PanelLeftClose,
  TriangleAlert,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { POP_TRANSITION } from "@/registry/ai-chat/animations";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { AiChatLoading } from "@/registry/ai-chat/components/ai-chat-loading";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  ANSWER_LATENCY,
  CARD_HIGHLIGHT_HOLD,
  ENTER,
  NO_MOTION,
  RISE_PX,
} from "../../motion";
import { P1 } from "../../P1";
import { P2 } from "../../P2";
import {
  FINDING_DETAIL,
  FINDING_GROUP,
  FINDING_ICON,
  FINDING_LABEL,
  FINDING_ROW,
  PANEL_BAND_EVIDENCE,
  PANEL_BAND_NEXT_MOVE,
  PANEL_EYEBROW,
  PANEL_EYEBROW_GAP,
  PANEL_LEDE,
} from "../../panel-type";
import { StructuredTable } from "../../StructuredTable";
import { alternativeFor, buildComparisonAnswer } from "./answers";
import {
  type AnswerAction,
  type MessageBlock,
  type ThreadFinding,
  useAssistantThread,
} from "./assistant-thread-context";
import { useCart } from "./cart-context";
import {
  ANSWER_COPY,
  CATALOG_ITEMS,
  INFERRED_REQUEST_QUANTITY,
  RECOMMENDATION,
  THREAD_GROUP_LABELS,
} from "./data";
import { RailDock } from "./RailDock";
import type { CatalogItem } from "./types";
import { type StagedReveal, useStagedReveal } from "./use-staged-reveal";

// Deck j1-06: XPS defense, bold numbered lines + price-priority closer.
const XPS_DEFENSE = `**1. Price after EPP**: The X1 Carbon's employee discount brings it to $1,249. The XPS starts lower but its discount is smaller. After EPP, the Carbon wins by $38 per unit.

**2. Spec match**: The Carbon ships 32 GB standard. The XPS is 16 GB; upgrading it to match adds $120 and 5–7 days to delivery.

**3. Same IT image**: Your team's last two laptop orders were ThinkPads, same driver stack, same setup scripts, no re-enrollment.

If price is the priority, the XPS is the closer call. On spec, delivery, and total cost, the Carbon leads.`;

// Deck j1-06: Yoga defense, touch premium + memory shortfall + form factor.
const YOGA_DEFENSE = `**1. Price after EPP**: The X1 Yoga's touchscreen adds $150 to the base price. After EPP, it lands at $1,999, $150 more than the Carbon for hardware your contractors won't use in field work.

**2. Spec shortfall**: The Yoga ships 16 GB. Your request calls for 32 GB; the Carbon meets it out of the box.

**3. Form factor for the role**: The convertible hinge is built for designers who flip to tablet mode. For event contractors on a clamshell day, it adds weight and hinge wear with no payoff. The Carbon is lighter and lasts longer in laptop-only use.

If touchscreen mobility matters for these contractors, the Yoga is worth a second look. On spec and total cost for this request, the Carbon leads.`;

const DELL_XPS_ID = "dell-xps-14";

// An assistant response's prose is narration, so it sets to the panel's own
// lede treatment rather than repeating a size and leading here.
const RESPONSE_MARKDOWN_CLASSNAME = cn(
  PANEL_LEDE,
  "py-1 bg-transparent prose dark:prose-invert max-w-none",
);

// Deck j1-06: P1 correction, scoped to request only, nothing saved.
const P1_CORRECTION =
  "Got it, noted for this request. The X1 Carbon already meets 32 GB, so your picks stay the same. Nothing is saved; it applies to this request only.";

// Deck j1-07: P2 correction text (Bookmark save receipt rendered separately as children).
const P2_CORRECTION = `Your 32 GB minimum is saved. The Yoga (16 GB) doesn't meet it. I've set it aside on the shelf with a "Show anyway" option.`;

// Opened generically (header ✦, or the Shelf's "not finding what you're
// looking for?"), no specific item to defend, just an open thread. The panel
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

type Phase = "thinking" | "response" | "correcting" | "corrected";

function msg(
  id: string,
  role: "user" | "assistant",
  content: string,
): UIMessage {
  return { id, role, parts: [{ type: "text", content }] };
}

/** Renders an assistant message by walking its blocks in order (prompt 45):
 * prose through `AiChatMessage` exactly as before, tables through the
 * shared `StructuredTable`. `children` (the receipt-chip treatment for a
 * memory write or a save) attaches to the last prose block, the same block
 * it attached to before this message could carry more than one, so a
 * single prose block message, the only kind that exists today, renders
 * identically. An unknown block type renders nothing for that block rather
 * than breaking the rest of the message. */
function AssistantMessageBlocks({
  idPrefix,
  blocks,
  markdownClassName,
  children,
  onAction,
}: {
  idPrefix: string;
  blocks: MessageBlock[];
  markdownClassName?: string;
  children?: ReactNode;
  /** Dispatches an answer's closing actions. Omitted where a message has
   * none, which is every message that is not an answer. */
  onAction?: (action: AnswerAction) => void;
}) {
  const lastProseIndex = blocks.map((b) => b.type).lastIndexOf("prose");
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => {
        // A message's own blocks are fixed at creation and never reordered,
        // inserted into, or removed from, so the index is a stable key here.
        // oxlint-disable-next-line eslint-plugin-react/no-array-index-key
        const key = `${idPrefix}-${i}`;
        if (block.type === "prose") {
          return (
            <AiChatMessage
              key={key}
              message={msg(key, "assistant", block.text)}
              hideActions
              assistantMarkdownClassName={markdownClassName}
            >
              {i === lastProseIndex && children}
            </AiChatMessage>
          );
        }
        if (block.type === "table") {
          return (
            <StructuredTable
              key={key}
              caption={block.caption}
              columns={block.columns}
              rows={block.rows}
            />
          );
        }
        if (block.type === "actions") {
          return (
            <div key={key} className="flex flex-wrap gap-1.5 pt-0.5">
              {block.actions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  variant={action.intent === "switch" ? "default" : "outline"}
                  size="sm"
                  className="h-auto rounded-full px-3 py-1 text-xs"
                  onClick={() => onAction?.(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/**
 * A step's findings. The current step's arrive one at a time when the panel
 * opens, each one fading and rising into place, with its status icon
 * resolving a beat after its own text has settled. Earlier, condensed steps
 * render complete: their reveal already happened.
 *
 * Nothing here decides any timing. `reveal` says what may be on screen, and
 * a null `reveal` means render everything.
 */
function StepFindings({
  findings,
  isCurrent,
  reveal,
  reduceMotion,
}: {
  findings: ThreadFinding[];
  isCurrent: boolean;
  reveal: StagedReveal | null;
  reduceMotion: boolean;
}) {
  return (
    <div className={cn(FINDING_GROUP, !isCurrent && "pl-1")}>
      {findings.map((finding, index) => {
        const labelShown = reveal ? reveal.label(index) : true;
        const detailShown = reveal ? reveal.detail(index) : true;
        const iconShown = reveal ? reveal.icon(index) : true;
        if (!labelShown) return null;
        return (
          <motion.div
            key={finding.label}
            data-slot="step-finding"
            data-icon-resolved={iconShown ? "true" : "false"}
            className={FINDING_ROW}
            initial={reduceMotion ? false : { opacity: 0, y: RISE_PX }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? NO_MOTION : ENTER}
          >
            {/* The icon holds its slot from the start, so resolving does not
                shift the label it belongs to. The grid row aligns it to the
                row start, which puts its box inside the label's first line
                box rather than on the label's baseline: a circled glyph
                hung from the baseline sits above the line entirely. */}
            <span className={FINDING_ICON} data-slot="step-finding-icon">
              <AnimatePresence>
                {iconShown && (
                  <motion.span
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={reduceMotion ? NO_MOTION : POP_TRANSITION}
                    className="block"
                  >
                    <CircleCheck className="size-4" aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <div className="min-w-0">
              <p className={FINDING_LABEL} data-slot="step-finding-label">
                {finding.label}
              </p>
              {detailShown && (
                <motion.p
                  className={FINDING_DETAIL}
                  data-slot="step-finding-detail"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={reduceMotion ? NO_MOTION : ENTER}
                >
                  {finding.detail}
                </motion.p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

interface ShelfDockProps {
  /** The catalog item whose "Compare with my pick" was triggered, drives the
   * defense copy. Null when opened generically: the activity summary + an
   * open thread, no scripted defense. */
  subject: CatalogItem | null;
  /** Which step the panel was opened from, drives the generic mode's
   * step-aware starter prompts. Ignored when `subject` is set. */
  context?: GenericContext;
  /** Overrides `context`'s own built-in starter prompts (prompt 33). Every
   * built-in set is scoped to Marcus's own catalog journey; a surface with
   * no starters of its own should pass an empty array here rather than
   * showing his. Omit to keep the existing per-context behaviour
   * unchanged. */
  starterQuestions?: string[];
  onClose: () => void;
  onCorrectionMade: () => void;
}

export function ShelfDock({
  subject,
  context = "selection",
  starterQuestions,
  onClose,
  onCorrectionMade,
}: ShelfDockProps) {
  const reduceMotion = useReducedMotion();
  const { entries, currentStep, addQaEntry, highlightItem, highlightedItemId } =
    useAssistantThread();
  const { setQuantity, quantities } = useCart();
  const defense = subject
    ? subject.id === DELL_XPS_ID
      ? XPS_DEFENSE
      : YOGA_DEFENSE
    : "";
  const [phase, setPhase] = useState<Phase>("thinking");
  const [correctionInput, setCorrectionInput] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  // A question waits here while the canned ack "thinks", then lands in the
  // shared thread, so the delay reads the same as the rest of the app.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [genericInput, setGenericInput] = useState("");
  // Earlier step entries condense by default; a user can reopen one.
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(
    () => new Set(),
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Opening the panel moves focus into it, so the claim trigger that opened
   * it hands the keyboard on rather than leaving it behind in the headline.
   * The panel mounts on open, so a mount effect is the open event.
   */
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // The findings being revealed: the current step's, which is the entry that
  // renders expanded. Nothing else in the thread stages.
  const currentStepEntry = entries.find(
    (entry) => entry.kind === "step" && entry.step === currentStep,
  );
  const revealCount =
    currentStepEntry?.kind === "step" && !currentStepEntry.fields
      ? currentStepEntry.detail.length
      : 0;

  /**
   * Highlights the card the last finding concerns, so the panel is visibly
   * operating on the results list rather than narrating beside it. Held
   * briefly, then cleared; cancelling the sequence clears it too.
   */
  const highlightFinalFinding = () => {
    if (currentStepEntry?.kind !== "step") return;
    const itemId = currentStepEntry.detail.at(-1)?.itemId;
    if (!itemId) return;
    highlightItem(itemId);
  };

  const reveal = useStagedReveal({
    count: revealCount,
    active: !subject && revealCount > 0,
    immediate: Boolean(reduceMotion),
    onComplete: highlightFinalFinding,
  });

  // Clearing the highlight is a timer of its own so the hold survives the
  // reveal sequence finishing, and so unmounting the panel takes it down.
  useEffect(() => {
    if (!highlightedItemId) return;
    const id = setTimeout(
      () => highlightItem(null),
      CARD_HIGHLIGHT_HOLD * 1000,
    );
    return () => clearTimeout(id);
  }, [highlightedItemId, highlightItem]);

  // The panel unmounting must not leave a card lit up behind it.
  useEffect(() => () => highlightItem(null), [highlightItem]);

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

  // Generic mode: brief "thinking" delay, then the answer lands in the
  // shared thread. A question naming another product gets the structured
  // comparison; anything else keeps the canned acknowledgement it had.
  useEffect(() => {
    if (!pendingQuestion) return;
    const question = pendingQuestion;
    const id = setTimeout(() => {
      const alternative = alternativeFor(question, RECOMMENDATION.itemId);
      const structured = alternative
        ? buildComparisonAnswer(RECOMMENDATION.itemId, alternative.id)
        : null;
      addQaEntry(question, structured ?? GENERIC_ACK);
      setPendingQuestion(null);
    }, ANSWER_LATENCY * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  /**
   * Runs an answer's closing action through the cart, which is the app's
   * existing selection handling: switching moves the requested quantity onto
   * the alternative and takes the old pick back off, keeping leaves the
   * selection alone. No second selection path is introduced here.
   */
  const handleAnswerAction = (action: AnswerAction) => {
    if (action.intent === "keep") return;
    const next = CATALOG_ITEMS.find((item) => item.id === action.itemId);
    if (!next) return;
    const outgoing = CATALOG_ITEMS.filter(
      (item) => item.id !== next.id && (quantities[item.id] ?? 0) > 0,
    );
    setQuantity(next, quantities[next.id] || INFERRED_REQUEST_QUANTITY);
    for (const item of outgoing) setQuantity(item, 0);
  };

  // Tracks the last qa/note entry id already scrolled to, so a newly
  // posted exchange (e.g. the evidence exchange, prompt 47) scrolls to its
  // own top, landing on the question rather than the bottom of a tall
  // answer with tables in it. Step entries are excluded here on purpose:
  // Marcus's and Priya's Bridge/Choose/Review progression already reads
  // correctly scrolled to the bottom (the current, expanded step is the
  // last thing in the list), and this prompt's own fix is scoped to an
  // exchange landing mid answer, not to that progression.
  const lastScrolledEntryId = useRef<string | null>(null);

  // Scroll on content change: to the newest qa/note entry's own top if one
  // was just posted, otherwise to the bottom (thinking/typing indicators,
  // Marcus's scripted phase/correction changes, and step entries, stay
  // bottom anchored, exactly as before).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const lastEntry = entries.at(-1);
    if (
      lastEntry &&
      lastEntry.kind !== "step" &&
      lastEntry.id !== lastScrolledEntryId.current
    ) {
      lastScrolledEntryId.current = lastEntry.id;
      const node = el.querySelector<HTMLElement>(
        `[data-entry-id="${lastEntry.id}"]`,
      );
      if (node) {
        node.scrollIntoView({ block: "start" });
        return;
      }
    }
    el.scrollTop = el.scrollHeight;
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
    // Asking something ends the arrival sequence: remaining timers are
    // cleared and the findings settle at once, so nothing trickles in behind
    // the question.
    reveal.settle();
    highlightItem(null);
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
  const starters = starterQuestions ?? SUGGESTED_QUESTIONS[context];

  /**
   * The chips on offer now. They regenerate after each answer rather than
   * standing aside once the thread has Q&A in it: whatever has already been
   * asked drops out, and once the step's own starters are used up the
   * remaining laptops in the catalog become the next thing to ask about, so
   * the panel always offers a move.
   */
  const askedQuestions = new Set(
    entries
      .filter((entry) => entry.kind === "qa")
      .map((entry) => entry.question),
  );
  const unaskedStarters = starters.filter(
    (question) => !askedQuestions.has(question),
  );
  // Which alternatives have already been the subject of a question, resolved
  // the same way an incoming question is, so a chip cannot re-offer a
  // comparison the thread already contains.
  const comparedIds = new Set<string>();
  for (const question of askedQuestions) {
    const id = alternativeFor(question, RECOMMENDATION.itemId)?.id;
    if (id) comparedIds.add(id);
  }
  const derivedSuggestions = CATALOG_ITEMS.filter(
    (item) =>
      item.category === "Laptops" &&
      item.id !== RECOMMENDATION.itemId &&
      !comparedIds.has(item.id),
  ).map((item) => ANSWER_COPY.compare(item.name));
  const suggestions =
    unaskedStarters.length > 0 ? unaskedStarters : derivedSuggestions;
  const showSuggestions =
    !subject && !pendingQuestion && suggestions.length > 0 && reveal.chips;

  return (
    <RailDock open width="380px" onExpand={() => {}}>
      {/* Focus target for the panel opening. `tabIndex={-1}` makes it
          programmatically focusable without adding a tab stop, and the
          region role plus label give it a name once focus lands. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="region"
        aria-label="Assistant"
        className="relative h-full w-[380px] outline-none"
      >
        {/* Ambient glow, cropped and bleeding off the panel's top-left
            corner, clipped by RailDock's own overflow-hidden <aside>.
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
          {/* Header, h-12 matches the page header so the borders line up.
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
              onClick={() => {
                // Halt first: the panel stays mounted through
                // `AnimatePresence`'s exit, so a still-running sequence
                // would keep inserting findings on the way out.
                reveal.halt();
                highlightItem(null);
                onClose();
              }}
              aria-label="Close assistant"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </div>

          {/* Body, scrolls independently so the composer stays pinned + visible.
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
                    <AssistantMessageBlocks
                      idPrefix="shelf-a"
                      blocks={[{ type: "prose", text: defense }]}
                      markdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
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
                      <AssistantMessageBlocks
                        idPrefix="corr-a-p1"
                        blocks={[{ type: "prose", text: P1_CORRECTION }]}
                        markdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
                      />
                    </P1>
                    <P2>
                      <AssistantMessageBlocks
                        idPrefix="corr-a"
                        blocks={[{ type: "prose", text: P2_CORRECTION }]}
                        markdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
                      >
                        <div className="flex items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                          <Bookmark
                            className="size-3.5 shrink-0 text-primary"
                            aria-hidden
                          />
                          Saved to Design Contractor spec · preferences updated
                        </div>
                      </AssistantMessageBlocks>
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
                      <div
                        key={entry.id}
                        data-entry-id={entry.id}
                        className="space-y-3"
                      >
                        <AiChatMessage
                          message={msg(`${entry.id}-q`, "user", entry.question)}
                          hideActions
                        />
                        <AssistantMessageBlocks
                          idPrefix={`${entry.id}-a`}
                          blocks={entry.answer}
                          markdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
                          onAction={handleAnswerAction}
                        />
                      </div>
                    );
                  }
                  if (entry.kind === "note") {
                    // Memory write, made visible, same receipt-chip treatment
                    // as the dock's own P2 correction save.
                    return (
                      <div key={entry.id} data-entry-id={entry.id}>
                        <AssistantMessageBlocks
                          idPrefix={entry.id}
                          blocks={entry.text}
                          markdownClassName={RESPONSE_MARKDOWN_CLASSNAME}
                        >
                          <div className="flex items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                            <Bookmark
                              className="size-3.5 shrink-0 text-primary"
                              aria-hidden
                            />
                            Saved to Design Contractor spec · preferences
                            updated
                          </div>
                        </AssistantMessageBlocks>
                      </div>
                    );
                  }
                  const isCurrent = entry.step === currentStep;
                  const isOpen = isCurrent || manuallyExpanded.has(entry.id);
                  return (
                    <div
                      key={entry.id}
                      data-slot="thread-entry"
                      data-step={entry.step}
                      data-current={isCurrent ? "true" : "false"}
                      data-open={isOpen ? "true" : "false"}
                    >
                      {isCurrent ? (
                        <p
                          data-slot="panel-eyebrow"
                          className={cn(PANEL_EYEBROW, PANEL_EYEBROW_GAP)}
                        >
                          {THREAD_GROUP_LABELS[entry.step]} · {entry.time}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(entry.id)}
                          className="flex w-full items-center gap-2 text-left"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {THREAD_GROUP_LABELS[entry.step]}:
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
                        <p data-slot="panel-lede" className={PANEL_LEDE}>
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
                              <div>
                                {/* Same eyebrow treatment as the phase line
                                    and the chips group, so every group in
                                    the panel is introduced the same way. */}
                                <p
                                  data-slot="panel-eyebrow"
                                  className={cn(
                                    PANEL_EYEBROW,
                                    PANEL_EYEBROW_GAP,
                                  )}
                                >
                                  Straight from your records
                                </p>
                                {/* Same glyph, colour and vertical spacing
                                    as a finding: with both on the circled
                                    primary mark there is no longer any
                                    reason for two rhythms in one panel. The
                                    type hierarchy stays inverted here, since
                                    a record leads with its value and a
                                    finding leads with its label. */}
                                <div
                                  className={FINDING_GROUP}
                                  data-slot="records-group"
                                >
                                  {entry.fields
                                    .filter((f) => !f.assumed)
                                    .map((f) => (
                                      <div
                                        key={f.label}
                                        className={FINDING_ROW}
                                        data-slot="records-row"
                                      >
                                        <span
                                          className={FINDING_ICON}
                                          data-slot="records-icon"
                                        >
                                          <CircleCheck
                                            className="size-4"
                                            aria-hidden
                                          />
                                        </span>
                                        <div className="min-w-0">
                                          <p
                                            className={FINDING_LABEL}
                                            data-slot="records-value"
                                          >
                                            {f.value}
                                          </p>
                                          <p className={FINDING_DETAIL}>
                                            {f.label} · {f.source}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Rule one of two: narration above, evidence
                          // below. Only under the current step, which is the
                          // entry that carries narration to divide from.
                          <div
                            data-slot="panel-band-evidence"
                            className={isCurrent ? PANEL_BAND_EVIDENCE : "mt-3"}
                          >
                            <StepFindings
                              findings={entry.detail}
                              isCurrent={isCurrent}
                              reveal={isCurrent ? reveal : null}
                              reduceMotion={Boolean(reduceMotion)}
                            />
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

                {/* Chips sit in the thread, below the most recent message,
                    rather than pinned above the composer: they are the next
                    move in the conversation, so they belong where the
                    conversation currently ends. Last to arrive on open. */}
                {showSuggestions && (
                  <motion.div
                    data-slot="panel-band-next-move"
                    className={PANEL_BAND_NEXT_MOVE}
                    initial={reduceMotion ? false : { opacity: 0, y: RISE_PX }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? NO_MOTION : ENTER}
                  >
                    {/* Rule two of two: evidence above, next move below. The
                        heading takes the same eyebrow treatment as the phase
                        line, so the two bands are introduced the same way. */}
                    <p
                      data-slot="panel-eyebrow"
                      className={cn(PANEL_EYEBROW, PANEL_EYEBROW_GAP)}
                    >
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((question) => (
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
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Composer + caveat pinned to bottom, same 24px inset as the panel. */}
          {showComposer && (
            <div className="shrink-0 px-6 pt-4 pb-6">
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
