"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { OCCUPANT_STATES } from "@/components/ui/occupant";
import { PageHeader } from "@/components/ui/page-header";
import { SidePanel } from "@/components/ui/side-panel";
import {
  occupantPadding,
  PADDED_INSET_PX,
  scrollOwner,
} from "@/lib/composition";
import { OCCUPANT_REGISTRY } from "@/lib/occupant-registry.generated";
import { SURFACE_SPECS } from "@/lib/occupants.generated";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

/**
 * Preview only: one registered occupant in one surface, for the occupant
 * checks. No template: occupants are checked against surfaces.
 *
 *   ?occupant=<name>&surface=<page-header|side-panel|content-area>
 *   &example=<name>&state=<ready|loading|empty|error|agent-updating>
 *
 * The box starts at the occupant's minWidth (plus the surface padding);
 * checks resize [data-slot=occupant-fixture] to sweep widths.
 */
function Fixture() {
  const params = useSearchParams();
  const entry = OCCUPANT_REGISTRY.find(
    (o) => o.spec.name === params.get("occupant"),
  );
  const surface = SURFACE_SPECS.find((s) => s.name === params.get("surface"));
  if (!entry || !surface) return null;
  const { spec } = entry;
  const padding = occupantPadding(spec);
  const state =
    OCCUPANT_STATES.find((s) => s === params.get("state")) ?? "ready";
  const content = entry.render(params.get("example") ?? "", { state });
  const width =
    spec.requires.minWidth + (padding === "padded" ? 2 * PADDED_INSET_PX : 0);

  return (
    <div
      data-slot="occupant-fixture"
      data-surface-name={surface.name}
      className="flex h-[640px] flex-col"
      style={{ width }}
    >
      {surface.name === "page-header" && (
        <PageHeader padding={padding}>{content}</PageHeader>
      )}
      {surface.name === "side-panel" && (
        <SidePanel
          side="end"
          aria-label={spec.label}
          padding={padding}
          scroll={scrollOwner(surface, spec)}
          className="w-full [--side-panel-width:100%]"
        >
          {content}
        </SidePanel>
      )}
      {surface.name === "content-area" && (
        <ContentArea padding={padding} scroll={scrollOwner(surface, spec)}>
          {content}
        </ContentArea>
      )}
    </div>
  );
}

export default function OccupantFixturePage() {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background p-8 not-prose">
      <LocaleProvider>
        <Suspense>
          <Fixture />
        </Suspense>
      </LocaleProvider>
    </div>
  );
}
