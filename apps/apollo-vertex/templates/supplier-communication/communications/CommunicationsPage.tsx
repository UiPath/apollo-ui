"use client";

import { RefreshCw } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseDetail } from "../components/case-detail";
import {
  filterByStatus,
  filterCases,
  needsHuman,
  type StatusFilter,
  type WorkflowFilter,
} from "../components/case-filters";
import { CaseList } from "../components/case-list";
import { SupplierInbox } from "../components/supplier-inbox";
import { WorkflowRail } from "../components/workflow-rail";
import { KPIS } from "../data/supplier-cases";

export function CommunicationsPage() {
  const [workflow, setWorkflow] = useState<WorkflowFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  // Ties the rail to the filter button in the list pane via aria-controls.
  const railId = useId();

  // The status filter lives here, not in the list, so the selection fallback
  // below sees the same set the list renders and cannot strand the detail pane
  // on a case the active tab hides.
  const inWorkflow = filterCases(workflow);
  const visible = filterByStatus(inWorkflow, status);

  // Counts come from the workflow-filtered set, before the tab narrows it.
  const needsCount = inWorkflow.filter((c) => needsHuman(c)).length;
  const counts = {
    all: inWorkflow.length,
    needs: needsCount,
    flight: inWorkflow.length - needsCount,
  };

  // Derived rather than stored: when the filter hides the selected case, the
  // detail pane falls back to the first case now visible instead of stranding
  // on something the list no longer shows.
  const selected =
    visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;

  return (
    // The shell's content slot is already a flex column inside an h-screen,
    // overflow-hidden frame, so this fills the space that is left rather than
    // claiming a fresh viewport height (h-dvh would overflow it).
    <Tabs
      defaultValue="ap"
      className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden bg-background"
    >
      {/* @3xl:gap-10 sets the grid column gap to 40px, which is the space
          between the KPI run and the AP team / Supplier tabs. */}
      <PageHeader bordered className="@3xl:gap-10">
        <PageHeaderNav>
          <PageHeaderTitleGroup>
            <PageHeaderTitle>Supplier communications</PageHeaderTitle>
            {/* Static, like NOW: a live "x minutes ago" would drift away from
                the fixed timestamps the rest of the demo is anchored to. */}
            <PageHeaderDescription className="flex items-center gap-2">
              Updated 1 minute ago
              <Button
                variant="link"
                size="sm"
                className="h-auto gap-1 p-0 text-xs font-normal"
              >
                <RefreshCw className="size-3" />
                Refresh
              </Button>
            </PageHeaderDescription>
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderContent className="justify-center gap-10 @3xl:justify-center @3xl:gap-10">
          {KPIS.map((kpi) => (
            <PageHeaderField key={kpi.label}>
              <PageHeaderFieldLabel>{kpi.label}</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="text-lg font-bold tabular-nums">
                {kpi.value}
              </PageHeaderFieldValue>
            </PageHeaderField>
          ))}
        </PageHeaderContent>

        <PageHeaderActions>
          <TabsList>
            <TabsTrigger value="ap">AP team</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
          </TabsList>
        </PageHeaderActions>
      </PageHeader>

      <TabsContent value="ap" className="flex min-h-0 flex-1">
        <WorkflowRail
          value={workflow}
          onChange={setWorkflow}
          id={railId}
          collapsed={!railOpen}
        />
        {/*
          Only the list's right edge is draggable. `preserve-pixel-size` keeps
          the list at the width the user set when the window resizes, letting
          the detail pane absorb the change, which is how a mail client behaves.
          No autoSaveId: the prototype persists nothing.
        */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-w-0 flex-1"
        >
          <ResizablePanel
            defaultSize="22rem"
            minSize="17rem"
            maxSize="34rem"
            groupResizeBehavior="preserve-pixel-size"
            className="h-full"
          >
            <CaseList
              cases={visible}
              status={status}
              onStatusChange={setStatus}
              counts={counts}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              railOpen={railOpen}
              onToggleRail={() => setRailOpen((open) => !open)}
              railId={railId}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="hover:bg-primary/40" />
          <ResizablePanel className="h-full">
            <CaseDetail case={selected} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </TabsContent>

      <TabsContent value="supplier" className="flex min-h-0 flex-1">
        <SupplierInbox />
      </TabsContent>
    </Tabs>
  );
}
