"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { useUser } from "@/registry/shell/shell-user-provider";
import { ANALYTICS_SCOPE } from "../data/analytics";
import { ph } from "../data/placeholders";
import { ExecutiveLayout } from "./DashboardContent";
import { DashboardDataProvider } from "./DashboardDataProvider";
import { DashboardGlow } from "./DashboardGlow";
import { elenaDataset, elenaLayout } from "./elena-data";
import { defaultDarkCards } from "./glow-config";
import { useViewMode } from "./use-view-mode";

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
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader bordered className="shrink-0 px-6">
        <PageHeaderNav>
          <PageHeaderTitleGroup>
            <PageHeaderTitle>Analytics</PageHeaderTitle>
          </PageHeaderTitleGroup>
        </PageHeaderNav>
        <PageHeaderContent>
          <Badge variant="secondary" status="info">
            {ph("PH-74", "badge")}
          </Badge>
          <PageHeaderField>
            <PageHeaderFieldLabel>Period</PageHeaderFieldLabel>
            <PageHeaderFieldValue>
              {ANALYTICS_SCOPE.period}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Region</PageHeaderFieldLabel>
            <PageHeaderFieldValue>
              {ANALYTICS_SCOPE.region}
            </PageHeaderFieldValue>
          </PageHeaderField>
          <PageHeaderField>
            <PageHeaderFieldLabel>Entities</PageHeaderFieldLabel>
            <PageHeaderFieldValue>
              {ANALYTICS_SCOPE.entities}
            </PageHeaderFieldValue>
          </PageHeaderField>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button variant="outline" size="sm" disabled>
            {ph("PH-72", "time range")}
          </Button>
          <Button size="sm" disabled>
            {ph("PH-73", "primary action")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div
        ref={containerRef}
        className="@container relative flex flex-1 flex-col gap-4 overflow-hidden p-6"
      >
        <DashboardGlow />
        <div className="relative z-10 flex flex-1 flex-col gap-4">
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
