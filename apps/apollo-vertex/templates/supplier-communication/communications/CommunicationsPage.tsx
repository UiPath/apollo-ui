"use client";

import { useState } from "react";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseDetail } from "../components/case-detail";
import { filterCases, type WorkflowFilter } from "../components/case-filters";
import { CaseList } from "../components/case-list";
import { SupplierInbox } from "../components/supplier-inbox";
import { WorkflowRail } from "../components/workflow-rail";
import { KPIS } from "../data/supplier-cases";

export function CommunicationsPage() {
  const [workflow, setWorkflow] = useState<WorkflowFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = filterCases(workflow);

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
      <PageHeader bordered>
        <PageHeaderNav>
          <PageHeaderTitleGroup>
            <PageHeaderTitle>Supplier communications</PageHeaderTitle>
          </PageHeaderTitleGroup>
        </PageHeaderNav>

        <PageHeaderContent>
          {KPIS.map((kpi) => (
            <PageHeaderField key={kpi.label}>
              <PageHeaderFieldLabel>{kpi.label}</PageHeaderFieldLabel>
              <PageHeaderFieldValue className="tabular-nums">
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
        <WorkflowRail value={workflow} onChange={setWorkflow} />
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
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
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
