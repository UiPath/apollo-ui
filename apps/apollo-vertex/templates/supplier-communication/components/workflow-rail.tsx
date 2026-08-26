"use client";

import { WORKFLOWS } from "../data/supplier-cases";
import type { WorkflowFilter } from "./case-filters";
import { PaneRail } from "./pane-rail";
import type { RailSection } from "./pane-rail-types";

const SECTIONS: RailSection<WorkflowFilter>[] = [
  {
    heading: "Workflows",
    interactive: true,
    items: [
      { id: "all", label: "All open cases", count: 31 },
      ...WORKFLOWS.map((w) => ({ id: w.id, label: w.label, count: w.count })),
    ],
  },
  {
    heading: "Status",
    items: [
      { label: "Resolved today", count: 18 },
      { label: "Awaiting approval", count: 3 },
      { label: "Escalated", count: 4 },
    ],
  },
];

interface WorkflowRailProps {
  value: WorkflowFilter;
  onChange: (wf: WorkflowFilter) => void;
}

export function WorkflowRail({ value, onChange }: WorkflowRailProps) {
  return (
    <PaneRail
      label="Workflows"
      sections={SECTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
