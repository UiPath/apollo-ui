"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/registry/shell/shell-user-provider";
import { ANALYTICS_SCOPE } from "../data/analytics";
import { ph } from "../data/placeholders";
import { ExecutiveLayout } from "./DashboardContent";
import { DashboardDataProvider } from "./DashboardDataProvider";
import { DashboardGlow } from "./DashboardGlow";
import { elenaDataset, elenaLayout } from "./elena-data";
import { defaultDarkCards } from "./glow-config";
import { useViewMode } from "./use-view-mode";

// Scope and period filters read as plain text with a chevron, not bordered
// controls, so the header stays quiet next to the primary action.
const FILTER_TRIGGER_CLASS =
  "border-transparent bg-transparent shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent";

// Same time-of-day greeting Home.tsx/BuyFlow.tsx already use, duplicated
// per file rather than shared, matching this codebase's own convention.
function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Elena Vasquez's procurement outcomes view (prompt 62, copied verbatim
 * from PR 616's dashboard experiment and then subtracted down): a page
 * header (badge, scope, an inert time range control and primary action,
 * all placeholders per prompt 55), and the copied ExecutiveLayout (hero,
 * prompt bar, insight grid) repointed at Elena's own data module. Nothing
 * here imports from templates/dashboard/; see the report for every field
 * the copied components expect and what Elena's data does not supply.
 */
export function Outcomes() {
  const { user } = useUser();
  const greeting = `${timeOfDayGreeting()}, ${user?.first_name ?? "there"}.`;
  const containerRef = useRef<HTMLDivElement>(null);
  const viewMode = useViewMode(containerRef);

  return (
    <div
      className={`flex h-full flex-col ${viewMode === "stacked" ? "overflow-x-hidden" : "overflow-hidden"}`}
    >
      <PageHeader className="shrink-0 px-12">
        <PageHeaderNav>
          <PageHeaderTitleGroup className="ml-6">
            <PageHeaderTitle>Procurement outcomes</PageHeaderTitle>
          </PageHeaderTitleGroup>
        </PageHeaderNav>
        <PageHeaderActions className="mr-6">
          {/* The data module holds one value each for region, entities, and
            period. Further options for any of the three are pending a
            ruling, registered as PH-86 for period rather than authored
            here. */}
          <Select defaultValue={ANALYTICS_SCOPE.region}>
            <SelectTrigger size="sm" className={FILTER_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANALYTICS_SCOPE.region}>
                {ANALYTICS_SCOPE.region}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue={ANALYTICS_SCOPE.entities}>
            <SelectTrigger size="sm" className={FILTER_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANALYTICS_SCOPE.entities}>
                {ANALYTICS_SCOPE.entities}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue={ANALYTICS_SCOPE.period}>
            <SelectTrigger size="sm" className={FILTER_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANALYTICS_SCOPE.period}>
                {ANALYTICS_SCOPE.period}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary">
            {ph("PH-73", "secondary action")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div
        ref={containerRef}
        className="@container relative flex flex-1 min-h-0 flex-col gap-4 -mt-2 px-6 pb-6"
      >
        <DashboardGlow />
        <div className="relative z-10 flex flex-1 min-h-0 flex-col gap-4">
          <DashboardDataProvider initialDataset={{ ...elenaDataset, greeting }}>
            <ExecutiveLayout
              cards={defaultDarkCards}
              layout={elenaLayout}
              viewMode={viewMode}
            />
          </DashboardDataProvider>
        </div>
      </div>
    </div>
  );
}
