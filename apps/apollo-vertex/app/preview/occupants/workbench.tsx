"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { OccupantInSurface } from "@/app/_components/occupant-in-surface";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { fitsSurface } from "@/lib/composition";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { surfaceLabel } from "@/lib/surface-labels";
import { DetailsPanel } from "./details-panel";
import { type Floor, FloorProbe } from "./floor-probe";
import { OccupantList } from "./occupant-list";
import { afterLayout, overflowProblems } from "./overflow";
import { usePageTheme } from "./use-page-theme";
import { WorkbenchDock } from "./workbench-dock";
import { WorkbenchHeader } from "./workbench-header";
import { lowerLabel, surfaceRange, widthStatus } from "./workbench-model";
import {
  defaultSurface,
  defaultWidth,
  HOSTED_SURFACES,
  occupantInset,
  serializeWorkbenchView,
  specFor,
  type WorkbenchView,
} from "./workbench-url-state";

/** A vertical surface's height on the stage. */
const STAGE_HEIGHT = 560;
const LIST_ID = "workbench-list";
const DETAILS_ID = "workbench-details";

interface WorkbenchProps {
  initial: WorkbenchView;
}

export function Workbench({ initial }: WorkbenchProps) {
  const { t } = useTranslation();
  const [view, setView] = useState(initial);
  const update = (patch: Partial<WorkbenchView>) =>
    setView((current) => ({ ...current, ...patch }));

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
    ).then((inner) => {
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
    const dock = stageAreaRef.current?.querySelector("[data-workbench-dock]");
    if (!dock) return;
    const observer = new ResizeObserver(() =>
      setDockHeight(dock.getBoundingClientRect().height),
    );
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);
  const dockSpace =
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
    { "--dock-space": `${dockHeight}px` } as CSSProperties;

  if (!spec || !surface || !host) return null;
  const claim = fitsSurface(surface, spec);
  const inset = occupantInset(spec);

  const selectOccupant = (name: string) => {
    const next = specFor(name);
    const keep = next && fitsSurface(surface, next).fits;
    const nextSurface = keep ? view.surface : defaultSurface(next);
    update({
      occupant: name,
      surface: nextSurface,
      width: defaultWidth(next, nextSurface),
    });
  };

  const sampleFloor = measured[view.sample];
  const floorOuter =
    typeof sampleFloor === "number" ? sampleFloor + inset : null;
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
  const status = widthStatus({
    width: view.width,
    range,
    floor: floorOuter,
    overflows: (current?.problems.length ?? 0) > 0,
  });

  return (
    <div
      data-workbench
      data-theme={view.theme}
      className="fixed inset-0 z-50 flex bg-background text-foreground not-prose"
    >
      <OccupantList
        id={LIST_ID}
        open={view.listOpen}
        selected={view.occupant}
        onSelect={selectOccupant}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <WorkbenchHeader
          label={spec.label}
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
        />

        <div ref={stageAreaRef} className="relative min-h-0 flex-1">
          {/* The stage: only the occupant, in the surface's real host. */}
          <div
            ref={stageRef}
            data-workbench-stage
            className="absolute inset-0 overflow-auto bg-[radial-gradient(color-mix(in_oklab,var(--color-border)_70%,transparent)_1px,transparent_1px)] bg-size-[--spacing(4)_--spacing(4)]"
          >
            {/* Room under the occupant for the dock, so it's never hidden behind it. */}
            <div
              style={dockSpace}
              className="flex min-h-full min-w-fit items-center justify-center p-8 pb-[calc(var(--dock-space)+--spacing(12))]"
            >
              {claim.fits ? (
                // The page's ground under the surface, as in a template, and its edge.
                <div
                  data-workbench-frame
                  className="relative bg-background outline-1 outline-border"
                >
                  {/*
                   * The frame's name, like an artboard's: above its top-left
                   * corner, never over the occupant. Decorative: the dock and the
                   * slider's value text say the same.
                   */}
                  <span
                    aria-hidden="true"
                    data-workbench-frame-tag
                    className="pointer-events-none absolute start-0 bottom-full mb-1.5 whitespace-nowrap text-xs text-muted-foreground select-none"
                  >
                    {t("workbench_frame_tag", {
                      surface: surfaceLabel(surface.name),
                      width: view.width,
                    })}
                  </span>
                  <OccupantInSurface
                    // A fresh occupant per sample, so its own state (a selection) resets.
                    key={`${spec.name}-${view.sample}`}
                    occupant={spec.name}
                    surface={surface.name}
                    example={view.sample}
                    state={view.state}
                    width={view.width}
                    height={STAGE_HEIGHT}
                  />
                </div>
              ) : (
                <section
                  data-workbench-no-fit
                  aria-labelledby="workbench-no-fit"
                  className="max-w-md rounded-lg border border-border bg-background p-6 shadow-sm"
                >
                  <h3 id="workbench-no-fit" className="font-semibold">
                    {t("workbench_no_fit_title", {
                      occupant: spec.label,
                      surface: lowerLabel(surface.name),
                    })}
                  </h3>
                  <ul className="mt-2 list-disc ps-5 text-sm text-muted-foreground">
                    {claim.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm">{t("workbench_no_fit_hint")}</p>
                </section>
              )}
            </div>
          </div>

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

      {/* Floors are measured out of sight, one probe per sample. */}
      {claim.fits &&
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
