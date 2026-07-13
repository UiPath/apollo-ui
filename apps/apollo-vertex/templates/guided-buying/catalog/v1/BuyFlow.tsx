"use client";

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { AiChatEmptySuggestions } from "@/registry/ai-chat/components/ai-chat-empty-suggestions";
import { AiChatInput } from "@/registry/ai-chat/components/ai-chat-input";
import { BuyScaffold } from "./BuyScaffold";
import { type BuyPhase, useConversation } from "./conversation-context";
import {
  CATALOG_PHASES,
  FlowPhaseBar,
  NON_CATALOG_PHASES,
} from "./FlowPhaseBar";
import { GuidedBuy } from "./GuidedBuy";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Where the surface is heading as it animates out — drives the exit direction.
type Leaving = null | "catalog" | "configure";

// The three demo launch points — one per use case. Catalog = requester
// self-serving; quote = generic handoff to a seeded Workbench item; contract =
// the Configure-with-agent wizard.
const CATALOG_STARTER = "2 ThinkPad X1 laptops for our new designers.";
const SOURCING_STARTER = "Hire 2 contract designers for the Q3 rebrand.";
const CONTRACT_STARTER = "Add 12 mobile lines for the Denver team.";
const STARTERS = [CATALOG_STARTER, SOURCING_STARTER, CONTRACT_STARTER];

// Title + subtext per step — the constant header anchor. The first two ask
// (gather, verify); the rest deliver.
const HEADERS: Record<BuyPhase, { title: string; subtext: ReactNode }> = {
  intake: {
    title: "What do you want to buy?",
    subtext: "Describe the item, quantity, and who it’s for.",
  },
  bridge: {
    title: "Review the request details",
    subtext:
      "The assistant filled in the details it could. Check them before choosing an item.",
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
    sendCatalogRequest,
    sendSourcingRequest,
    sendServiceRequest,
    stop,
    startFresh,
    stepBack,
  } = useConversation();

  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState<Leaving>(null);
  const [input, setInput] = useState("");

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
  const locationKey = useRouterState({ select: (s) => s.location.state.__TSR_index });
  useEffect(() => {
    if ((fromConfigure && !resetChat) || fromReview) return;
    startFresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]); // intentional: deps read fresh on each navigation

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

  // "See all": lift/fade the surface out, then navigate — the catalog plays its
  // own fade-up entrance on mount.
  const handleSeeAll = () => {
    if (reduceMotion) {
      void navigate({ to: "/catalog" });
      return;
    }
    setLeaving("catalog");
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
    leaving === "catalog"
      ? { y: -8, opacity: 0 }
      : leaving === "configure"
        ? { opacity: 0 }
        : { x: 0, y: 0, opacity: 1 };

  const isIntake = phase === "intake";
  const header = HEADERS[phase];

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
      className="h-full"
      initial={fromConfigure && !reduceMotion ? { opacity: 0 } : false}
      animate={exitTarget}
      transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: EASE }}
      onAnimationComplete={() => {
        if (leaving === "catalog") void navigate({ to: "/catalog" });
        else if (leaving === "configure") void navigate({ to: "/configure" });
      }}
    >
      <BuyScaffold
        stepKey={phase}
        title={header.title}
        subtext={header.subtext}
        // The cart belongs once products are on screen (the Selection step).
        showCart={phase === "selection"}
        // No back/reset on Intake — there's no previous step and it's already fresh.
        {...(isIntake ? {} : { onBack: stepBack, onReset: startFresh })}
        phaseBar={phaseBar}
      >
        {isIntake ? (
          // Intake — the one conversational surface (free text + chips).
          <div className="space-y-7">
            <AiChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleIntakeSubmit}
              onStop={stop}
              isLoading={false}
              placeholder="Tell us what you want to buy…"
              // Attach a quote, spec, or PO for Autopilot to parse — the paperclip
              // menu, paste, and the pending-file chips (which grow the input) all
              // turn on with this.
              acceptedFileTypes="image/*,.pdf,.csv,.xlsx,.docx,.txt"
            />
            <div>
              <p className="text-center text-xs font-medium text-muted-foreground">
                Try an example:
              </p>
              <AiChatEmptySuggestions
                suggestions={STARTERS}
                onSelect={handleSuggestion}
              />
            </div>
          </div>
        ) : (
          // Guided middle — structured surfaces fueled by the agent.
          <GuidedBuy onSeeAll={handleSeeAll} onConfigure={handleConfigure} />
        )}
      </BuyScaffold>
    </motion.div>
  );
}
