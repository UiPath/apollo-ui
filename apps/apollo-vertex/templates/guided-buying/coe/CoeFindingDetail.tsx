"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PageHeader,
  PageHeaderBackButton,
  PageHeaderContent,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import {
  AUTO_CLEARED_TOTAL,
  AVG_REQUEST_TO_PO_DAYS,
  COMMODITY_CYCLE_TIME,
  SOFTWARE_STAGE_BREAKDOWN,
} from "../data/analytics";
import { ph } from "../data/placeholders";
import { EvidenceDisclosureTrigger } from "../workbench/WorkbenchDetail";
import {
  FINDINGS,
  type Finding,
  notifyFindings,
  subscribeFindings,
} from "./findings-data";

// Reused verbatim from PromptBar.tsx's ANSWER_DELAY_MS (prompt 90): a
// short pause before the result reveals, so it reads as computed rather
// than instant, no token by token stream and no new motion.
const TEST_DELAY_MS = 900;

const SECURITY_STAGE = SOFTWARE_STAGE_BREAKDOWN.find(
  (stage) => stage.stage === "Security",
);
const LONGEST_COMMODITY = COMMODITY_CYCLE_TIME[0];

// The snapshot has to be a value that changes, not the record's own
// object reference: publishing mutates that same object in place (the
// record correctness convention this whole record follows), so a
// reference snapshot would never look different to useSyncExternalStore
// and this page would never re-render on its own publish.
function findingVersion(id: string): string {
  const finding = FINDINGS[id];
  return finding ? `${finding.sentAt ?? ""}|${finding.publishedAt ?? ""}` : "";
}

// `sentAt`/`publishedAt` come from the hook's own snapshot string, not a
// second, separate `FINDINGS[id]` read in the render body: this app
// builds with the React Compiler (next.config.ts, `reactCompiler: true`),
// which memoizes a read keyed only on stable module level references
// (`FINDINGS`, `id`) as pure, and never invalidates it, since it can't
// see that `FINDINGS[id]`'s own fields mutate in place. The rest of the
// record (text, raisedAt, raisedBy, sourceSurface, sourceCard) never
// mutates after seeding, so reading those straight off `FINDINGS[id]` is
// fine; only the two fields this page writes need to come from the
// snapshot the compiler can't cache away.
function useFinding(id: string): Finding | undefined {
  const version = useSyncExternalStore(
    subscribeFindings,
    () => findingVersion(id),
    () => "",
  );
  const finding = FINDINGS[id];
  if (!finding) return;
  const [sentAt, publishedAt] = version.split("|");
  return {
    ...finding,
    sentAt: sentAt || null,
    publishedAt: publishedAt || null,
  };
}

/**
 * Ravi's finding detail (prompt 94). Route and back affordance follow
 * DecisionWindow.tsx's own convention exactly: a plain `$id` param read
 * with `useParams`, a synchronous lookup against the seeded record (no
 * router loader, matching every route in this tree), a
 * `PageHeaderBackButton` pointing at the fixed list route rather than
 * browser history. The header's own field set is this record's, not
 * Dana's business fields, which don't apply to a finding.
 */
export function CoeFindingDetail() {
  const { id } = useParams({ from: "/coe/$id" });
  const navigate = useNavigate();
  const finding = useFinding(id);

  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const testTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (testTimeout.current) clearTimeout(testTimeout.current);
    },
    [],
  );

  if (!finding) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Finding not found.</p>
      </div>
    );
  }

  const handleTest = () => {
    setTesting(true);
    testTimeout.current = setTimeout(() => {
      setTesting(false);
      setTested(true);
    }, TEST_DELAY_MS);
  };

  const handlePublish = () => {
    // `finding` here is `useFinding`'s own spread copy (see that hook's
    // comment): the record to actually mutate is the shared one in
    // FINDINGS, keyed by the same id.
    const record = FINDINGS[id];
    if (record) record.publishedAt = new Date().toISOString();
    notifyFindings();
  };

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader bordered>
        <PageHeaderNav>
          <PageHeaderBackButton onClick={() => void navigate({ to: "/coe" })} />
          <PageHeaderTitleGroup>
            <PageHeaderTitle>{finding.text}</PageHeaderTitle>
          </PageHeaderTitleGroup>
        </PageHeaderNav>
        <PageHeaderContent>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Raised by</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {finding.raisedBy}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Source</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {finding.sourceSurface} · {finding.sourceCard}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField className="shrink-0">
            <PageHeaderFieldLabel>Raised</PageHeaderFieldLabel>
            <PageHeaderFieldValue className="overflow-visible">
              {finding.raisedAt}
            </PageHeaderFieldValue>
          </PageHeaderField>
        </PageHeaderContent>
      </PageHeader>

      <div className="flex flex-col gap-6 px-4 pb-8 sm:px-6 lg:px-8">
        {/* AI toolkit treatment (app/guidelines/ai-toolkit/surfaces.tsx,
            "Gradient subtle, no border"), the same pattern Elena's own
            recommendation card uses: background, border, and title colors
            lifted from that example. The mark sits beside the label, one
            row, `AiCaveat`'s default (standalone) variant discloses once
            for the whole block, after the rule and its evidence, before
            any action. */}
        <Card
          variant="solid"
          className="mt-6 gap-0 border-0"
          style={{ background: "var(--ai-gradient)" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-insight-900 dark:text-insight-50">
              <AiMark size={14} />
              {ph("PH-116", "proposed rule label")}
            </CardTitle>
            <CardDescription className="text-insight-800 dark:text-insight-100">
              {ph("PH-117", "proposed rule")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <EvidenceDisclosureTrigger
              label={
                SECURITY_STAGE
                  ? `${SECURITY_STAGE.stage} · ${SECURITY_STAGE.days} days`
                  : ""
              }
              expanded={false}
            />
            <EvidenceDisclosureTrigger
              label={`Average · ${AVG_REQUEST_TO_PO_DAYS} days`}
              expanded={false}
            />
            <EvidenceDisclosureTrigger
              label={`${LONGEST_COMMODITY.commodity} · ${LONGEST_COMMODITY.days} days`}
              expanded={false}
            />
          </CardContent>
          <AiCaveat className="px-6" />
          {!tested && (
            <CardFooter>
              <Button size="sm" variant="ai-soft" onClick={handleTest}>
                {ph("PH-118", "test this rule action label")}
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Section 5: a summary test, not a replay, reusing prompt 90's
            own delay and reveal rather than a stream or new motion. */}
        {(testing || tested) && (
          <Card variant="glass">
            <CardContent className="flex flex-col gap-4">
              {testing && (
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-2/3 rounded-full bg-muted/50 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-muted/50 animate-pulse" />
                </div>
              )}
              {tested && (
                <>
                  <div className="flex flex-wrap gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Average cycle today
                      </p>
                      <p className="mt-1 text-2xl font-medium text-foreground">
                        {AVG_REQUEST_TO_PO_DAYS} days
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Projected average
                      </p>
                      <p className="mt-1 text-2xl font-medium text-foreground">
                        {ph("PH-119", "projected average cycle time")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Requests affected
                      </p>
                      <p className="mt-1 text-2xl font-medium text-foreground">
                        {ph("PH-120", "requests affected count")} of{" "}
                        {AUTO_CLEARED_TOTAL}
                      </p>
                    </div>
                  </div>
                  {finding.publishedAt ? (
                    <p className="text-sm text-muted-foreground">
                      {ph("PH-122", "publish confirmation")}
                    </p>
                  ) : (
                    <div>
                      <Button size="sm" onClick={handlePublish}>
                        {ph("PH-121", "publish action label")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
