"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { OccupantInSurface } from "@/app/_components/occupant-in-surface";
import { STAGE_HEIGHT } from "@/app/_components/stage";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import type { SlotStatus } from "@/app/_components/template-hosts";
import { fitsSurface } from "@/lib/composition";
import { EXAMPLE_ROLES } from "@/lib/occupant-entry";
import { specFor } from "@/lib/occupant-lookup";
import { surfaceLabel } from "@/lib/surface-labels";
import { DetailsPanel } from "./details-panel";
import { type Floor, FloorProbe } from "./floor-probe";
import { Inspector } from "./inspector";
import { NoFitCard } from "./no-fit-card";
import { OccupantList } from "./occupant-list";
import { StageFrame } from "./stage-frame";
import { TemplateDock } from "./template-dock";
import { TemplateStage } from "./template-stage";
import { useChangeLog } from "./use-change-log";
import { useCompose } from "./use-compose";
import { useDockHeight } from "./use-dock-height";
import { useFitScale } from "./use-fit-scale";
import { useFloors } from "./use-floors";
import { useInspector } from "./use-inspector";
import { usePageTheme } from "./use-page-theme";
import { useStageOverflow } from "./use-stage-overflow";
import { WorkbenchDnd } from "./workbench-dnd";
import { WorkbenchDock } from "./workbench-dock";
import { WorkbenchHeader } from "./workbench-header";
import { locationsOf } from "./workbench-locations";
import { lowerLabel, surfaceRange, widthStatus } from "./workbench-model";
import { WorkbenchPanel } from "./workbench-panel";
import { WorkbenchToaster } from "./workbench-toaster";
import {
  defaultSurface,
  defaultWidth,
  HOSTED_SURFACES,
  normalizeView,
  serializeWorkbenchView,
  switchView,
  templateFor,
  type WorkbenchView,
} from "./workbench-url-state";

const LIST_ID = "workbench-list";
const DETAILS_ID = "workbench-details";
const INSPECTOR_ID = "workbench-inspector";

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
  // The template view's inspector, and the slot selected on its stage.
  const inspector = useInspector(
    initial.mode === "template" && initial.editing,
  );
  // Every change to what the page holds or how it's laid out, with a toast to undo it.
  const { change, reset } = useChangeLog(view, setView);
  // Changes from the composer, by inspector or drop, and each panel's revision.
  const { compose, revisions } = useCompose(view, change);
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

  // Floors, measured out of sight once the stage has shown the occupant.
  const {
    key: probeKey,
    probing,
    measured,
    onFloor,
  } = useFloors(view.occupant, view.surface);

  // Whether the occupant on the stage overflows right now.
  const stageRef = useRef<HTMLDivElement>(null);
  const overflow = useStageOverflow(stageRef, host?.inner, view);

  // The theme applies to the whole page while the workbench is open.
  usePageTheme(view.theme);

  // The dock floats over the stage: its height is kept free below the occupant.
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const dockHeight = useDockHeight(stageAreaRef, view.mode);
  // The template view fits the page to the stage, past its padding (p-8) and
  // the room kept for the dock (pb-[dock + 12]); at 100% it scrolls instead.
  const {
    scale,
    height: pageHeight,
    roomY,
  } = useFitScale(stageRef, {
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

  // Edit opens the inspector; Preview closes it. It's open only in Edit.
  const setEditing = (editing: boolean) => {
    update({ editing });
    inspector.setEditing(editing);
  };
  const selectOccupant = (name: string) => {
    const next = specFor(name);
    const keep = next && fitsSurface(surface, next).fits;
    const nextSurface = keep ? view.surface : defaultSurface(next);
    update({
      occupant: name,
      surface: nextSurface,
      width: defaultWidth(next, nextSurface),
    });
    // In the template view the list selects on the page, which is Edit's.
    if (view.mode === "template") {
      if (!view.editing) setEditing(true);
      inspector.fromList(name, view.contents);
    }
  };
  const inTemplate = view.mode === "template" && templateHost;

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

  const editMode = view.mode === "template" && view.editing;

  return (
    <WorkbenchDnd
      host={templateFor(view.template)}
      contents={view.contents}
      onContents={compose}
    >
      <div
        data-slot="workbench"
        data-theme={view.theme}
        // A recessed canvas, a step darker than the chrome in either theme;
        // its dots read as a grid, quieter than any Edit-mode slot outline.
        className="fixed inset-0 z-50 flex flex-col bg-background text-foreground not-prose [--workbench-canvas:var(--sidebar)] [--workbench-dots:color-mix(in_oklab,var(--muted-foreground)_20%,var(--workbench-canvas))]"
      >
        {/* A top bar across the window; the columns and stage below it. */}
        <WorkbenchHeader
          // The template view has no focused occupant: it's the page.
          label={
            view.mode === "template" && templateHost
              ? templateHost.label
              : spec.label
          }
          docsHref={docsHref}
          listId={LIST_ID}
          listOpen={view.listOpen}
          onToggleList={() => update({ listOpen: !view.listOpen })}
          // The right-hand column is one view's at a time.
          panel={inTemplate ? "inspector" : "details"}
          detailsId={inTemplate ? INSPECTOR_ID : DETAILS_ID}
          detailsOpen={inTemplate ? inspector.open : view.detailsOpen}
          onToggleDetails={() =>
            inTemplate
              ? view.editing
                ? inspector.toggle()
                : setEditing(true)
              : update({ detailsOpen: !view.detailsOpen })
          }
          sample={view.sample}
          onSample={(sample) => update({ sample })}
          state={view.state}
          onState={(state) => update({ state })}
          theme={view.theme}
          onTheme={(theme) => update({ theme })}
          mode={view.mode}
          onMode={(mode) => setView((prev) => switchView(prev, mode))}
          template={view.template}
          editing={view.editing}
          onEditing={setEditing}
          onReset={reset}
          onTemplate={(template) => update({ template })}
        />
        <div className="flex min-h-0 flex-1">
          <WorkbenchPanel id={LIST_ID} open={view.listOpen} kind="list">
            <OccupantList
              id={LIST_ID}
              selected={view.occupant}
              onSelect={selectOccupant}
              editing={editMode}
              {...(inTemplate && {
                locations: locationsOf(
                  inTemplate,
                  view.contents,
                  view.layout,
                  slotStatus,
                ),
              })}
            />
          </WorkbenchPanel>

          <main className="flex min-w-0 flex-1 flex-col">
            <div ref={stageAreaRef} className="relative min-h-0 flex-1">
              <div
                ref={stageRef}
                data-slot="workbench-stage"
                // Its own stacking context: a template's z-index stays inside it.
                className="absolute inset-0 isolate overflow-auto bg-(color:--workbench-canvas) bg-[radial-gradient(var(--workbench-dots)_1px,transparent_1px)] bg-size-[--spacing(4)_--spacing(4)]"
              >
                {/* Room under the occupant for the dock, so it's never hidden behind it. */}
                <div
                  style={dockSpace}
                  className="flex min-h-full min-w-fit items-center justify-center p-8 pb-[calc(var(--dock-space)+--spacing(12))]"
                >
                  {templateHost && view.mode === "template" ? (
                    <TemplateStage
                      host={templateHost}
                      shell={view.shell}
                      layout={view.layout}
                      contents={view.contents}
                      tabs={view.tabs}
                      renames={view.renames}
                      revisions={revisions}
                      editing={view.editing}
                      selected={inspector.selected}
                      onSelect={inspector.select}
                      inspectorId={INSPECTOR_ID}
                      onTab={(slot, id) =>
                        update({ tabs: { ...view.tabs, [slot]: id } })
                      }
                      onStatus={setSlotStatus}
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
                        // Above the dock, like the template's page: the
                        // occupant scrolls inside a shorter frame.
                        height={Math.min(STAGE_HEIGHT, roomY)}
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
                  shell={view.shell}
                  onShell={(shell) => update({ shell })}
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

          <WorkbenchPanel
            id={inTemplate ? INSPECTOR_ID : DETAILS_ID}
            open={inTemplate ? inspector.open : view.detailsOpen}
            kind="column"
          >
            {inTemplate ? (
              <Inspector
                id={INSPECTOR_ID}
                host={inTemplate}
                selected={inspector.selected}
                hint={inspector.hint}
                layout={view.layout}
                onLayout={(layout) => change({ layout })}
                status={slotStatus}
                contents={view.contents}
                onContents={compose}
                renames={view.renames}
                onRenames={(renames) => update({ renames })}
              />
            ) : (
              <DetailsPanel
                id={DETAILS_ID}
                spec={spec}
                surface={surface.name}
                width={view.width}
                floor={claim.fits ? worstFloor : "unavailable"}
                overflow={current}
              />
            )}
          </WorkbenchPanel>
        </div>

        {claim.fits &&
          view.mode === "surface" &&
          probing &&
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
        <WorkbenchToaster
          theme={view.theme}
          dockHeight={dockHeight}
          columnOpen={inTemplate ? inspector.open : view.detailsOpen}
        />
      </div>
    </WorkbenchDnd>
  );
}
