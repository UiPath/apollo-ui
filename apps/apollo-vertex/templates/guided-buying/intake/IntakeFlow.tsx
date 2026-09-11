"use client";

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BuyScaffold } from "../catalog/v1/BuyScaffold";
import { FlowFooterBar } from "../catalog/v1/FlowFooter";
import { FlowPhaseBar } from "../catalog/v1/FlowPhaseBar";
import { J3_INTAKE_PHASES } from "../catalog/v1/flow-phases";
import { ShelfDock } from "../catalog/v1/ShelfDock";
import { useContentOverflow } from "../catalog/v1/use-content-overflow";
import { DOCUMENTS, ph } from "../data";
import { Home } from "../home/Home";
import { DataInfoStep } from "./DataInfoStep";
import { ExtractedRequestReview } from "./ExtractedRequestReview";
import { GeneralInfoStep } from "./GeneralInfoStep";
import { useIntakeState } from "./intake-state-context";
import { ReviewStep } from "./ReviewStep";
import { SubmittedStep } from "./SubmittedStep";
import { VendorStep } from "./VendorStep";

// "compose" is the bare /intake state (no ?phase=...), a real member of the
// union rather than a missing value, so nothing here needs to read as
// undefined the way BuyFlow's own optional searchPhase does.
type IntakePhase =
  | "compose"
  | "details"
  | "vendor"
  | "data-info"
  | "general-info"
  | "review"
  | "done";

// The order form Priya actually attaches at intake is v1 (the terms
// correction and v2 only exist later in the seed's own timeline). Values
// come straight from the seed rather than the real uploaded file's own
// name/size, since the same filename is referenced on later J3 screens and
// a mismatch there would surface a discrepancy that isn't the point of
// this step.
function attachedDocument() {
  const doc = DOCUMENTS.find((d) => d.version === "v1");
  if (!doc) throw new Error("Order form v1 missing from seed");
  return doc;
}

// Details' own heading and sub-line, reworded from source material that
// used em-dashes. Registered as PH-11, pending confirmation, not rendered
// as a placeholder bracket (see the report). Rendered as given, in
// BuyScaffold's own title/subtext slot, the same mechanism Marcus's Bridge
// step uses, rather than something ExtractedRequestReview renders itself.
// PH-11
const DETAILS_TITLE = "Review what I read from the order form";
// PH-11
const DETAILS_SUBTEXT =
  "Every field below came from the document. Check them. Nothing to retype.";

// General Info's own heading and sub-line, same convention as Details'
// above. Only the sub-line is reworded from source material that used an
// em-dash (PH-11, pending confirmation).
const GENERAL_INFO_TITLE = "General information";
// PH-11
const GENERAL_INFO_SUBTEXT = "Prefilled from your profile. Editable.";

/**
 * Priya's own flow route (J3 intake). Same convention as /buy: bare renders
 * the composer, phases are addressable via ?phase=... on this one route,
 * read from the URL rather than local state so it's the single source of
 * truth (see the report on why this doesn't replicate /buy's own
 * bidirectional state/URL sync, J3 has none of the detour cases that
 * motivated it yet).
 */
export function IntakeFlow() {
  const navigate = useNavigate();
  const { ref: contentRef, overflowing } = useContentOverflow<HTMLDivElement>();
  const { askText, setAskText, dataInfoValues, vendorConfirmed } =
    useIntakeState();
  const [shelfDockOpen, setShelfDockOpen] = useState(false);

  const phase = useRouterState({
    select: (s): IntakePhase => {
      const raw = (s.location.search as { phase?: unknown }).phase;
      if (raw === "vendor") return "vendor";
      if (raw === "details") return "details";
      if (raw === "data-info") return "data-info";
      if (raw === "general-info") return "general-info";
      if (raw === "review") return "review";
      if (raw === "done") return "done";
      return "compose";
    },
  });

  const goTo = (target: IntakePhase) =>
    void navigate({
      to: "/intake",
      search: target === "compose" ? {} : { phase: target },
    });

  // The bare route: Priya's home, configured, rather than a second composer
  // surface (see the report). Reusing Home gives this phase its eyebrow,
  // headline, and Priya's own AiChatInput fix (typing works, send gates on
  // the attachment) for free, rather than duplicating any of the three.
  if (phase === "compose") {
    return (
      <Home
        placeholder={ph("PH-10")}
        starterSuggestions={[]}
        requestRows={[]}
        showResumeBand={false}
        requireAttachment
        footnote={ph("PH-23")}
        onSubmit={(text) => {
          const trimmed = text.trim();
          setAskText(trimmed.length > 0 ? trimmed : null);
          goTo("details");
        }}
      />
    );
  }

  const doc = attachedDocument();

  const phaseBarIndex =
    phase === "vendor"
      ? 1
      : phase === "data-info"
        ? 2
        : phase === "general-info"
          ? 3
          : phase === "review"
            ? 4
            : phase === "done"
              ? 5
              : 0;
  // Details, Data and Info, and General Info carry Marcus's own
  // heading/subtext treatment (A1), plain title + sub-line, no AI mark on a
  // highlighted term. Vendor and the bare composer supply their own hero,
  // matching Choose and Intake respectively. Review and Done join them,
  // since their outcome headings are centered content inside the step
  // itself, the same way Marcus's own Review and Done render their headings
  // rather than through BuyScaffold's title/subtext anchor block.
  const usesHeading =
    phase === "details" || phase === "data-info" || phase === "general-info";
  const title =
    phase === "details"
      ? DETAILS_TITLE
      : phase === "data-info"
        ? ph("PH-15a")
        : phase === "general-info"
          ? GENERAL_INFO_TITLE
          : "";
  const subtext =
    phase === "details"
      ? DETAILS_SUBTEXT
      : phase === "data-info"
        ? ph("PH-15b")
        : phase === "general-info"
          ? GENERAL_INFO_SUBTEXT
          : null;

  return (
    <div className="flex h-full">
      <AnimatePresence>
        {shelfDockOpen && (
          <ShelfDock
            subject={null}
            context="selection"
            onClose={() => setShelfDockOpen(false)}
            onCorrectionMade={() => {
              // No correction surface wired for this selection context yet.
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative min-w-0 flex-1">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <BuyScaffold
              stepKey={phase}
              title={title}
              subtext={subtext}
              hideBrand={!usesHeading}
              headerTitle={askText ?? doc.filename}
              // Priya's typed ask reads like Marcus's, truncate at the end. The
              // document filename's extension carries meaning, so it gets the
              // middle variant once there's no typed ask to show instead.
              headerTitleTruncate={askText == null ? "middle" : "end"}
              // J3's own phase bar carries six phases against Marcus's four, so
              // it's wider at every width this app is used at (measured: ~600px
              // here vs ~330px on his). Marcus's own default leaves this slot
              // room to spare against his own narrower bar; reused here it would
              // still collide with this one, so this budget is computed against
              // J3's own widest phase bar (Done, all six checked) instead, to
              // leave a real gutter at the widest width this app is used at
              // (1440px). See the report: narrower widths (1024 to 1280px)
              // don't clear a full 40px gutter against this specific bar, since
              // the bar itself is already most of the available band width
              // there, a separate finding from this slot's own sizing.
              headerTitleMaxWidth="max-w-[180px]"
              assistantOpen={false}
              onOpenAssistant={() => {
                // No assistant surface wired for this flow yet.
              }}
              onReset={() => goTo("compose")}
              phaseBar={
                <FlowPhaseBar
                  phases={J3_INTAKE_PHASES}
                  currentIndex={phaseBarIndex}
                />
              }
              contentRef={contentRef}
            >
              {phase === "vendor" ? (
                <VendorStep
                  onOpenComparisonPanel={() => setShelfDockOpen(true)}
                />
              ) : phase === "data-info" ? (
                <DataInfoStep />
              ) : phase === "general-info" ? (
                <GeneralInfoStep />
              ) : phase === "review" ? (
                <ReviewStep />
              ) : phase === "done" ? (
                <SubmittedStep />
              ) : (
                <ExtractedRequestReview />
              )}
            </BuyScaffold>
          </div>

          {phase === "details" && (
            <FlowFooterBar
              bordered={overflowing}
              left={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goTo("compose")}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
              }
              right={
                <Button size="sm" onClick={() => goTo("vendor")}>
                  {`Continue to ${J3_INTAKE_PHASES[1]}`}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              }
            />
          )}
          {phase === "vendor" && (
            <FlowFooterBar
              bordered={overflowing}
              left={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goTo("details")}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
              }
              right={
                <Button
                  size="sm"
                  disabled={!vendorConfirmed}
                  onClick={() => goTo("data-info")}
                >
                  {`Continue to ${J3_INTAKE_PHASES[2]}`}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              }
            />
          )}
          {phase === "data-info" && (
            <FlowFooterBar
              bordered={overflowing}
              left={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goTo("vendor")}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
              }
              right={
                <Button
                  size="sm"
                  disabled={dataInfoValues.Q1 === ""}
                  onClick={() => goTo("general-info")}
                >
                  {`Continue to ${J3_INTAKE_PHASES[3]}`}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              }
            />
          )}
          {phase === "general-info" && (
            <FlowFooterBar
              bordered={overflowing}
              left={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goTo("data-info")}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
              }
              right={
                <Button size="sm" onClick={() => goTo("review")}>
                  {`Continue to ${J3_INTAKE_PHASES[4]}`}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              }
            />
          )}
          {phase === "review" && (
            <FlowFooterBar
              bordered={overflowing}
              left={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goTo("general-info")}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
              }
              right={
                <Button size="sm" onClick={() => goTo("done")}>
                  Submit request
                </Button>
              }
            />
          )}
          {phase === "done" && (
            <FlowFooterBar
              bordered={overflowing}
              right={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goTo("compose")}
                  >
                    Start new request
                  </Button>
                  <Button size="sm" disabled>
                    Track request
                  </Button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
