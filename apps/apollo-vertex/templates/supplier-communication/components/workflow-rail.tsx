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
];

interface WorkflowRailProps {
  value: WorkflowFilter;
  onChange: (wf: WorkflowFilter) => void;
  id?: string;
  collapsed?: boolean;
}

export function WorkflowRail({
  value,
  onChange,
  id,
  collapsed,
}: WorkflowRailProps) {
  return (
    <PaneRail
      label="Workflows"
      id={id}
      collapsed={collapsed}
      sections={SECTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
