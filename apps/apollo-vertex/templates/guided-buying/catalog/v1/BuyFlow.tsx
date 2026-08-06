"use client";

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AiChatEmptySuggestions } from "@/registry/ai-chat/components/ai-chat-empty-suggestions";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { useUser } from "@/registry/shell/shell-user-provider";
import { P2 } from "../../P2";
import { useTier } from "../../tier-context";
import { BuyScaffold } from "./BuyScaffold";
import { useCart } from "./cart-context";
import { type BuyPhase, useConversation } from "./conversation-context";
import {
  CONTRACT_STARTER,
  defaultQuantityFor,
  displayRequestTitle,
  SOURCING_STARTER,
  STARTER_SUGGESTIONS,
} from "./data";
import { FlowFooterProvider } from "./FlowFooter";
import {
  CATALOG_PHASES,
  FlowPhaseBar,
  NON_CATALOG_PHASES,
} from "./FlowPhaseBar";
import { GuidedBuy } from "./GuidedBuy";
import { ProductDetail } from "./ProductDetail";
import { ProductDetailOverlay } from "./ProductDetailOverlay";
import { PriceBasisProvider } from "./price-basis-context";
import { ShelfDock } from "./ShelfDock";
import { TeamsResumeCard } from "./TeamsResumeCard";
import type { CatalogItem } from "./types";
import { useContentOverflow } from "./use-content-overflow";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Where the surface is heading as it animates out — drives the exit direction.
type Leaving = null | "configure";

// Intake-only greeting, above the headline — time-of-day read at render.
function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Title + subtext per step — the constant header anchor. The first two ask
// (gather, verify); the rest deliver.
const HEADERS: Record<BuyPhase, { title: string; subtext: ReactNode }> = {
  intake: {
    title: "What can I get for you?",
    subtext: "Describe the item, quantity, and who it’s for.",
  },
  bridge: {
    title: "Review the request details",
    subtext: "Pulled from your profile and past orders",
  },
  selection: {
    title: "Select from matching options",
    subtext:
      "These in-stock catalog items match your request and include employee pricing.",
  },
  service: {
    title: "Review the request details",
    subtext:
      "The assistant filled in the details it could. Check them before continuing.",
  },
  sourcing: {
    title: "Review the request details",
    subtext:
      "The assistant filled in the details it could. Check them before sending.",
  },
  offcatalog: {
    title: "Routed to procurement.",
    subtext:
      "I've drafted the RFQ, shortlisted vendors, and sent it to procurement. You'll get an update here once it's sourced.",
  },
};

/**
 * The `/buy` front door. One persistent header anchor (BuyScaffold) across two
 * framings: Intake — the conversational "What do you need?" hero (free text +
 * chips), the one place chat is the right primitive — and, once a request is
 * made, a guided surface (GuidedBuy) of structured surfaces, not a transcript.
 * As the step changes, the title/subtext slide up and fade out/in (staggered).
 */
export function BuyFlow() {
  const {
    phase,
    requestTitle,
    hasResolved,
    sendCatalogRequest,
    sendSourcingRequest,
    sendServiceRequest,
    stop,
    startFresh,
    stepBack,
    pendingRevisionText,
    clearPendingRevision,
    seedPhase,
  } = useConversation();

  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState<Leaving>(null);
  const [input, setInput] = useState("");
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [shelfDockOpen, setShelfDockOpen] = useState(false);
  const [shelfDockSubject, setShelfDockSubject] = useState<CatalogItem | null>(
    null,
  );
  const [correctionMade, setCorrectionMade] = useState(false);
  const { ref: contentRef, overflowing } = useContentOverflow<HTMLDivElement>();
  const [shelfDetailItem, setShelfDetailItem] = useState<CatalogItem | null>(
    null,
  );

  const { inCart, setQuantity, quantities } = useCart();
  const { tier } = useTier();
  const { user } = useUser();
  // True when the attached band should show — drives the composer's embedded mode
  // so both elements share one continuous outline.
  const showBand = tier === "p2" && !resumeDismissed;

  const openShelfDetail = (item: CatalogItem) => setShelfDetailItem(item);
  const closeShelfDetail = () => setShelfDetailItem(null);

  // Header ✦ trigger — opens the assistant with no specific item in context.
  const openShelfDockGeneric = () => {
    setShelfDockSubject(null);
    setShelfDockOpen(true);
  };

  // Shelf's "Not finding what you're looking for?" — same generic assistant.
  const openShelfDockForLaptopSearch = () => {
    setShelfDockSubject(null);
    setShelfDockOpen(true);
  };

  // Returning from Configure: shift the surface back in from the left, and keep
  // the thread (the ServiceBridge they left) rather than resetting to the hero.
  const fromConfigure = useRouterState({
    select: (s) => s.location.state.fromConfigure === true,
  });
  // The finish line passes resetChat so "Back to Buy" lands on a fresh Intake
  // (the request is already submitted), not the Bridge they came from.
  const resetChat = useRouterState({
    select: (s) => s.location.state.resetChat === true,
  });
  // Returning from Review (phase back-click): keep the conversation intact so
  // the user lands back on the Selection step, not a fresh Intake.
  const fromReview = useRouterState({
    select: (s) => s.location.state.fromReview === true,
  });
  // Unique key for this navigation to /buy (changes on every new visit, even when
  // the component doesn't unmount). Fires startFresh on every fresh entry, but not
  // when returning from Configure mid-flow or stepping back from Review.
  const locationKey = useRouterState({
    select: (s) => s.location.state.__TSR_index,
  });
  // Router state updates (and this component's re-render) land a tick before
  // BuyFlow actually unmounts on its way to /review or /track — without this
  // guard, that stray re-render sees a changed locationKey and wipes the
  // conversation (requestText, hasResolved) right before those screens read it.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The catalog fork's Bridge/Selection phases addressed via /buy?phase=... —
  // read with useRouterState (this file's own established pattern) rather
  // than useSearch, since the route tree here isn't registered for
  // useSearch's typed `from` lookup.
  const searchPhase = useRouterState({
    select: (s) => {
      const raw = (s.location.search as { phase?: unknown }).phase;
      return raw === "bridge" || raw === "selection" ? raw : undefined;
    },
  });
  useEffect(() => {
    if (pathname !== "/buy") return;
    if ((fromConfigure && !resetChat) || fromReview) return;
    // A phase deep-link handles its own seeding below — a plain reset here
    // would fight it.
    if (searchPhase != null) return;
    startFresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]); // intentional: deps read fresh on each navigation

  // URL -> state: seed (or resync) whenever the URL's phase doesn't match
  // what's already in the conversation — a fresh /buy?phase=... load, or
  // browser back/forward changing the URL beneath an existing session.
  // Same "stray re-render" guard as the effect above: router state (and
  // this component's re-render) updates a tick before BuyFlow actually
  // unmounts on its way to /review or /track. Without the pathname check,
  // that stray render sees searchPhase drop to undefined (the destination
  // route has no phase param) and was wiping the conversation via
  // startFresh() right then — invisible until Back later remounted BuyFlow
  // onto the already-reset state.
  useEffect(() => {
    if (pathname !== "/buy") return;
    if (searchPhase === "bridge" || searchPhase === "selection") {
      if (phase !== searchPhase) seedPhase(searchPhase);
    } else if (phase === "bridge" || phase === "selection") {
      // Same exception as the effect above: returning from Review (its
      // Back button lands here with no phase param, by design) or from
      // Configure mid-flow intentionally keeps the conversation as-is —
      // this isn't a stray URL, so don't reset it out from under them.
      if ((fromConfigure && !resetChat) || fromReview) return;
      startFresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPhase]);

  // state -> URL: keep /buy's phase param in sync so Bridge/Selection are
  // real, back-button-able history entries instead of silent internal
  // transitions. Only these two are addressable this pass (see the routing
  // report) — service/sourcing/offcatalog stay click-through only.
  useEffect(() => {
    if (pathname !== "/buy") return;
    const target =
      phase === "bridge" || phase === "selection" ? phase : undefined;
    if (searchPhase === target) return;
    void navigate({
      to: "/buy",
      search: target ? { phase: target } : {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleSuggestion = (suggestion: string) => {
    if (suggestion === CONTRACT_STARTER) {
      sendServiceRequest(suggestion);
      return;
    }
    if (suggestion === SOURCING_STARTER) {
      sendSourcingRequest(suggestion);
      return;
    }
    sendCatalogRequest(suggestion);
  };

  const handleIntakeSubmit = () => {
    const text = input.trim();
    if (text) sendCatalogRequest(text);
  };

  // "Configure with agent": slide the surface out to the left; Configure slides
  // in from the right (see ConfigureFlow's entrance).
  const handleConfigure = () => {
    if (reduceMotion) {
      void navigate({ to: "/configure" });
      return;
    }
    setLeaving("configure");
  };

  // Configure isn't a peer screen, so it hands off with a fade (it expands open
  // on the other side) rather than a lateral swipe.
  const exitTarget =
    leaving === "configure" ? { opacity: 0 } : { x: 0, y: 0, opacity: 1 };

  const isIntake = phase === "intake";

  // A Revise action (from the Bridge's Request row) stages the prior request
  // text for the composer — load it once Intake is back on screen, then
  // consume it so it doesn't re-fill on a later, unrelated visit to Intake.
  useEffect(() => {
    if (isIntake && pendingRevisionText != null) {
      setInput(pendingRevisionText);
      clearPendingRevision();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntake, pendingRevisionText]);

  const header = HEADERS[phase];
  // Intake-only greeting line above the headline, e.g. "Good morning, Marcus."
  const intakeGreeting = `${timeOfDayGreeting()}, ${user?.first_name ?? "there"}.`;

  // Phase bar — shown once a request exists (not on Intake).
  const isCatalogPath = phase === "bridge" || phase === "selection";
  const isNonCatalogPath =
    phase === "sourcing" || phase === "service" || phase === "offcatalog";
  const catalogPhaseIndex = phase === "selection" ? 1 : 0;
  const nonCatalogPhaseIndex = phase === "offcatalog" ? 1 : 0;

  const phaseBar = isIntake ? undefined : isCatalogPath ? (
    <FlowPhaseBar
      phases={CATALOG_PHASES}
      currentIndex={catalogPhaseIndex}
      onClickPhase={catalogPhaseIndex > 0 ? () => stepBack() : undefined}
    />
  ) : isNonCatalogPath ? (
    <FlowPhaseBar
      phases={NON_CATALOG_PHASES}
      currentIndex={nonCatalogPhaseIndex}
    />
  ) : undefined;

  return (
    <motion.div
      className="flex h-full"
      initial={fromConfigure && !reduceMotion ? { opacity: 0 } : false}
      animate={exitTarget}
      transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: EASE }}
      onAnimationComplete={() => {
        if (leaving === "configure") void navigate({ to: "/configure" });
      }}
    >
      {/* Left, same slot as the shell sidebar — not a
          right-hand panel. */}
      <AnimatePresence>
        {shelfDockOpen && (
          <ShelfDock
            subject={shelfDockSubject}
            context={phase === "bridge" ? "bridge" : "selection"}
            onClose={() => {
              setShelfDockOpen(false);
              setShelfDockSubject(null);
            }}
            onCorrectionMade={() => setCorrectionMade(true)}
          />
        )}
      </AnimatePresence>
      <div className="relative min-w-0 flex-1">
        <div className="flex h-full flex-col">
          <FlowFooterProvider overflowing={overflowing}>
            <div className="min-h-0 flex-1">
              <BuyScaffold
                contentRef={contentRef}
                stepKey={phase}
                title={header.title}
                subtext={isIntake ? undefined : header.subtext}
                eyebrow={isIntake ? intakeGreeting : undefined}
                // The cart belongs once products are on screen (the Selection step).
                showCart={phase === "selection"}
                // Selection supplies its own hero — hide the shared anchor block.
                hideBrand={phase === "selection"}
                // No reset on Intake — there's no previous step and it's already fresh.
                {...(isIntake ? {} : { onReset: startFresh })}
                headerTitle={displayRequestTitle(requestTitle, hasResolved)}
                assistantOpen={shelfDockOpen}
                onOpenAssistant={openShelfDockGeneric}
                // Back never lives in the header — every step renders its own,
                // paired with its primary action, now in the shared FlowFooter.
                phaseBar={phaseBar}
              >
                {isIntake ? (
                  // Intake — the one conversational surface (free text + chips).
                  <div className="space-y-4">
                    <div>
                      <P2>
                        {!resumeDismissed && (
                          <TeamsResumeCard
                            // Re-sends as a new request; does not load a persisted draft.
                            onResume={() =>
                              sendCatalogRequest(
                                "15 laptops for Fusion Event contractors",
                              )
                            }
                            onDismiss={() => setResumeDismissed(true)}
                          />
                        )}
                      </P2>
                      {/* The band sits directly above, inset 8px narrower with its
                    own bottom shadow — a distinct layered piece, not fused
                    to the composer's edges. */}
                      <div className={cn(showBand && "relative z-10")}>
                        <AiChatInput
                          value={input}
                          onChange={setInput}
                          onSubmit={handleIntakeSubmit}
                          onStop={stop}
                          isLoading={false}
                          placeholder="Describe the item, quantity, and who it's for…"
                          // Attach a quote, spec, or PO for Autopilot to parse — the paperclip
                          // menu, paste, and the pending-file chips (which grow the input) all
                          // turn on with this.
                          acceptedFileTypes="image/*,.pdf,.csv,.xlsx,.docx,.txt"
                          embedded={showBand}
                        />
                      </div>
                    </div>
                    <AiChatEmptySuggestions
                      suggestions={STARTER_SUGGESTIONS}
                      onSelect={handleSuggestion}
                    />
                    <P2>
                      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <RefreshCw size={11} aria-hidden />
                        Requests stay in sync across Teams, web, and email
                      </p>
                    </P2>
                  </div>
                ) : (
                  // Guided middle — structured surfaces fueled by the agent.
                  <GuidedBuy
                    onConfigure={handleConfigure}
                    onWhyNotThisClick={(item) => {
                      setShelfDockSubject(item);
                      setShelfDockOpen(true);
                    }}
                    onNotFindingClick={openShelfDockForLaptopSearch}
                    correctionMade={correctionMade}
                    onYogaShowAnyway={() => setCorrectionMade(false)}
                    onOpenDetail={openShelfDetail}
                  />
                )}
              </BuyScaffold>
            </div>
          </FlowFooterProvider>
        </div>

        <AnimatePresence>
          {shelfDetailItem && (
            <ProductDetailOverlay key="shelf-detail" onClose={closeShelfDetail}>
              <PriceBasisProvider value="epp">
                <ProductDetail
                  item={shelfDetailItem}
                  defaultQuantity={defaultQuantityFor(shelfDetailItem)}
                  cartQuantity={quantities[shelfDetailItem.id] ?? 0}
                  inCart={inCart(shelfDetailItem.id)}
                  comparing={false}
                  onAddToCart={(qty) => setQuantity(shelfDetailItem, qty)}
                  onToggleCompare={() => {}}
                  onAskAgent={() => {}}
                />
              </PriceBasisProvider>
            </ProductDetailOverlay>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
