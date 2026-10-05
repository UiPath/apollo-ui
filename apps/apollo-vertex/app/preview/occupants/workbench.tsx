"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { OccupantInSurface } from "@/app/_components/occupant-in-surface";
import { STAGE_HEIGHT } from "@/app/_components/stage";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import type { SlotStatus } from "@/app/_components/template-hosts";
import { fitsSurface } from "@/lib/composition";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { specFor } from "@/lib/occupant-lookup";
import { overflowProblems } from "@/lib/overflow-problems";
import { surfaceLabel } from "@/lib/surface-labels";
import { DetailsPanel } from "./details-panel";
import { type Floor, FloorProbe } from "./floor-probe";
import { NoFitCard } from "./no-fit-card";
import { OccupantList } from "./occupant-list";
import { afterLayout, settled } from "./overflow";
import { StageFrame } from "./stage-frame";
import { TemplateDock } from "./template-dock";
import { TemplateStage } from "./template-stage";
import { useFitScale } from "./use-fit-scale";
import { usePageTheme } from "./use-page-theme";
import { WorkbenchDock } from "./workbench-dock";
import { WorkbenchHeader } from "./workbench-header";
import { lowerLabel, surfaceRange, widthStatus } from "./workbench-model";
import {
  defaultSlot,
  defaultSurface,
  defaultWidth,
  HOSTED_SURFACES,
  normalizeView,
  serializeWorkbenchView,
  slotFit,
  switchView,
  templateFor,
  type WorkbenchView,
} from "./workbench-url-state";

const LIST_ID = "workbench-list";
const DETAILS_ID = "workbench-details";

interface WorkbenchProps {
  initial: WorkbenchView;
  /** Where "Back to docs" goes. */
  docsHref: string;
}

export function Workbench({ initial, docsHref }: WorkbenchProps) {
  const { t } = useTranslation();
  const [view, setView] = useState(initial);
  // Every change keeps the occupant's panel and the page width in range.
  const update = (patch: Partial<WorkbenchView>) =>
    setView((current) => normalizeView({ ...current, ...patch }));
  // Each panel after the template's rules, reported by the template.
  const [slotStatus, setSlotStatus] = useState<Readonly<
    Record<string, SlotStatus>
  > | null>(null);

  // The whole view lives in the URL. replaceState, so changes don't fill history.
  useEffect(() => {
    const url = `${window.location.pathname}${serializeWorkbenchView(view)}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [view]);

  const spec = specFor(view.occupant);
  const surface = HOSTED_SURFACES.find((s) => s.name === view.surface);
  const host = SURFACE_HOSTS[view.surface];

  // Floors, measured out of sight for every sample in the selected surface.
  const probeKey = `${view.occupant}:${view.surface}`;
  const [floors, setFloors] = useState<{
    key: string;
    bySample: Partial<Record<ExampleRole, Floor>>;
  }>({ key: probeKey, bySample: {} });
  const onFloor = (sample: ExampleRole, floor: Floor) =>
    setFloors((current) => ({
      key: probeKey,
      bySample: {
        ...(current.key === probeKey ? current.bySample : {}),
        [sample]: floor,
      },
    }));
  const measured = floors.key === probeKey ? floors.bySample : {};

  // Whether the occupant on the stage overflows right now, measured after layout.
  const stageRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<{
    width: number;
    problems: string[];
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void afterLayout(
      () =>
        host &&
        stageRef.current?.querySelector(
          `[data-slot=occupant-fixture] ${host.inner}`,
        ),
    ).then(async (inner) => {
      // Measure once the resize has finished animating, not mid-transition.
      const fixture = inner?.closest("[data-slot=occupant-fixture]");
      if (fixture) await settled(fixture);
      if (cancelled) return;
      setOverflow(
        inner ? { width: view.width, problems: overflowProblems(inner) } : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    host,
    view.occupant,
    view.surface,
    view.sample,
    view.state,
    view.theme,
    view.width,
  ]);

  // The theme applies to the whole page while the workbench is open.
  usePageTheme(view.theme);

  // The dock floats over the stage: its height is kept free below the occupant.
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState(0);
  useEffect(() => {
    const dock = stageAreaRef.current?.querySelector(
      "[data-slot=workbench-dock]",
    );
    if (!dock) return;
    const observer = new ResizeObserver(() =>
      setDockHeight(dock.getBoundingClientRect().height),
    );
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);
  // The template view fits the page to the stage, past its padding (p-8) and
  // the room kept for the dock (pb-[dock + 12]); at 100% it scrolls instead.
  const { scale, height: pageHeight } = useFitScale(stageRef, {
    width: view.pageWidth,
    minHeight: STAGE_HEIGHT,
    reservedX: 2 * 32,
    reservedY: 32 + dockHeight + 48,
    enabled: view.mode === "template" && view.zoom === "fit",
  });
  const dockSpace =
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
    { "--dock-space": `${dockHeight}px` } as CSSProperties;

  if (!spec || !surface || !host) return null;
  const claim = fitsSurface(surface, spec);
  const templateHost = templateFor(view.template);

  const selectOccupant = (name: string) => {
    const next = specFor(name);
    const keep = next && fitsSurface(surface, next).fits;
    const nextSurface = keep ? view.surface : defaultSurface(next);
    const nextTemplate = templateFor(view.template);
    const keepSlot =
      nextTemplate && next && slotFit(nextTemplate, view.slot, next).fits;
    update({
      occupant: name,
      surface: nextSurface,
      width: defaultWidth(next, nextSurface),
      slot: keepSlot ? view.slot : defaultSlot(nextTemplate, next),
    });
  };

  // Every width here is the surface's outer width, padding included: the
  // slider, the frame tag, the floor, and the overflow check.
  const sampleFloor = measured[view.sample];
  const floorOuter = typeof sampleFloor === "number" ? sampleFloor : null;
  const sampleFloors = EXAMPLE_ROLES.map((role) => measured[role]);
  const worstFloor: Floor | "measuring" = sampleFloors.some(
    (f) => f === "clips",
  )
    ? "clips"
    : sampleFloors.every((f) => typeof f === "number")
      ? Math.max(...sampleFloors.map((f) => (typeof f === "number" ? f : 0)))
      : "measuring";
  const range = surfaceRange(surface, spec);
  const current =
    claim.fits && overflow?.width === view.width ? overflow : null;
  // The live overflow check decides Clips; the floor only places the marker.
  const status = widthStatus({
    width: view.width,
    range,
    overflows: (current?.problems.length ?? 0) > 0,
  });

  return (
    <div
      data-slot="workbench"
      data-theme={view.theme}
      className="fixed inset-0 z-50 flex bg-background text-foreground not-prose"
    >
      <OccupantList
        id={LIST_ID}
        open={view.listOpen}
        selected={view.occupant}
        onSelect={selectOccupant}
        docsHref={docsHref}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <WorkbenchHeader
          label={spec.label}
          docsHref={docsHref}
          listId={LIST_ID}
          listOpen={view.listOpen}
          onToggleList={() => update({ listOpen: !view.listOpen })}
          detailsId={DETAILS_ID}
          detailsOpen={view.detailsOpen}
          onToggleDetails={() => update({ detailsOpen: !view.detailsOpen })}
          sample={view.sample}
          onSample={(sample) => update({ sample })}
          state={view.state}
          onState={(state) => update({ state })}
          theme={view.theme}
          onTheme={(theme) => update({ theme })}
          mode={view.mode}
          onMode={(mode) => setView((prev) => switchView(prev, mode))}
          template={view.template}
          onTemplate={(template) =>
            update({ template, slot: defaultSlot(templateFor(template), spec) })
          }
        />

        <div ref={stageAreaRef} className="relative min-h-0 flex-1">
          <div
            ref={stageRef}
            data-slot="workbench-stage"
            // Its own stacking context: a template's z-index stays inside it.
            className="absolute inset-0 isolate overflow-auto bg-[radial-gradient(var(--divider)_1px,transparent_1px)] bg-size-[--spacing(4)_--spacing(4)]"
          >
            {/* Room under the occupant for the dock, so it's never hidden behind it. */}
            <div
              style={dockSpace}
              className="flex min-h-full min-w-fit items-center justify-center p-8 pb-[calc(var(--dock-space)+--spacing(12))]"
            >
              {templateHost && view.mode === "template" ? (
                <TemplateStage
                  host={templateHost}
                  spec={spec}
                  slot={view.slot}
                  shell={view.shell}
                  layout={view.layout}
                  contents={view.contents}
                  onStatus={setSlotStatus}
                  sample={view.sample}
                  state={view.state}
                  pageWidth={view.pageWidth}
                  pageHeight={pageHeight}
                  scale={scale}
                />
              ) : claim.fits ? (
                <StageFrame
                  tag={t("workbench_frame_tag", {
                    surface: surfaceLabel(surface.name),
                    width: view.width,
                  })}
                >
                  <OccupantInSurface
                    // A fresh occupant per sample, so its own state (a selection) resets.
                    key={`${spec.name}-${view.sample}`}
                    occupant={spec.name}
                    surface={surface.name}
                    example={view.sample}
                    state={view.state}
                    width={view.width}
                  />
                </StageFrame>
              ) : (
                <NoFitCard
                  title={t("workbench_no_fit_title", {
                    occupant: spec.label,
                    surface: lowerLabel(surface.name),
                  })}
                  reasons={claim.reasons}
                />
              )}
            </div>
          </div>

          {templateHost && view.mode === "template" ? (
            <TemplateDock
              host={templateHost}
              spec={spec}
              slot={view.slot}
              onSlot={(slot) => update({ slot })}
              shell={view.shell}
              onShell={(shell) => update({ shell })}
              layout={view.layout}
              onLayout={(layout) => update({ layout })}
              slotStatus={slotStatus}
              contents={view.contents}
              onContents={(contents) => update({ contents })}
              pageWidth={view.pageWidth}
              onPageWidth={(pageWidth) => update({ pageWidth })}
              zoom={view.zoom}
              onZoom={(zoom) => update({ zoom })}
              scale={scale}
            />
          ) : (
            <WorkbenchDock
              spec={spec}
              surface={surface.name}
              onSurface={(name) =>
                update({ surface: name, width: defaultWidth(spec, name) })
              }
              fitsHere={claim.fits}
              width={view.width}
              onWidth={(width) => update({ width })}
              marks={{ ...range, floor: floorOuter }}
              status={status}
            />
          )}
        </div>
      </main>

      <DetailsPanel
        id={DETAILS_ID}
        open={view.detailsOpen}
        spec={spec}
        surface={surface.name}
        width={view.width}
        floor={claim.fits ? worstFloor : "unavailable"}
        overflow={current}
      />

      {claim.fits &&
        view.mode === "surface" &&
        createPortal(
          <div
            aria-hidden="true"
            inert
            className="pointer-events-none fixed start-full top-0"
          >
            {EXAMPLE_ROLES.map((sample) => (
              <FloorProbe
                key={`${probeKey}:${sample}`}
                occupant={spec.name}
                surface={surface.name}
                sample={sample}
                onFloor={onFloor}
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
