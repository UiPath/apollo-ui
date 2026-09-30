"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { OccupantInSurface } from "@/app/_components/occupant-in-surface";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { Label } from "@/components/ui/label";
import { OCCUPANT_STATES, type OccupantState } from "@/components/ui/occupant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  fits,
  fitsSurface,
  type OccupantSpec,
  occupantPadding,
  PADDED_INSET_PX,
  type SurfaceSpec,
} from "@/lib/composition";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";

/*
 * Preview only: the occupant workbench. Any registered occupant, alone in
 * every registered surface, with no template. Pick the occupant, its
 * sample, its state, and the theme; drag each surface's width from its
 * minimum up. A surface the occupant doesn't fit shows why, from fits().
 *
 *   /preview/occupants?occupant=<name>   opens with that occupant
 *
 * Surfaces come from the occupant index and SURFACE_HOSTS, so a newly
 * registered surface shows up here with no changes.
 */

const HEIGHT = 560;
/** How far past its minimum each surface's width slider goes. */
const RANGE = 720;

const inset = (spec: OccupantSpec) =>
  occupantPadding(spec) === "padded" ? 2 * PADDED_INSET_PX : 0;

/** Where a surface's slider starts: its own minimum, or with none, where the occupant starts to fit. */
const sliderMin = (surface: SurfaceSpec, spec: OccupantSpec) =>
  surface.width?.min ?? spec.requires.minWidth + inset(spec);

/**
 * The reasons an occupant doesn't fit a surface at an outer width, from
 * fits(): the surface alone (scroll, orientation, its list of surfaces),
 * then the width, as if a slot held the surface at exactly that width.
 */
function reasonsAt(surface: SurfaceSpec, spec: OccupantSpec, width: number) {
  const claim = fitsSurface(surface, spec);
  if (!claim.fits) return claim.reasons;
  const slot = {
    name: "workbench",
    required: true,
    surfaces: [surface.name],
    width: { min: width, default: width },
  };
  return fits(slot, surface, spec).reasons;
}

interface ControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

function Control<T extends string>({
  label,
  value,
  options,
  onChange,
}: ControlProps<T>) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const option = options.find((o) => o.value === next);
          if (option) onChange(option.value);
        }}
      >
        <SelectTrigger id={id} className="w-44 max-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SurfaceBenchProps {
  surface: SurfaceSpec;
  spec: OccupantSpec;
  sample: ExampleRole;
  state: OccupantState;
}

/** One surface: its width slider, and the occupant in it or why it doesn't fit. */
function SurfaceBench({ surface, spec, sample, state }: SurfaceBenchProps) {
  const sliderId = useId();
  const min = sliderMin(surface, spec);
  const [width, setWidth] = useState(min);
  const reasons = reasonsAt(surface, spec, width);
  const claimed = fitsSurface(surface, spec).fits;
  return (
    <section
      aria-labelledby={`${sliderId}-title`}
      data-workbench-surface={surface.name}
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`${sliderId}-title`} className="text-sm font-semibold">
          {surfaceLabel(surface.name)}
          <span className="ms-2 font-normal text-muted-foreground">
            {surface.provides.orientation}
          </span>
        </h2>
        {claimed && (
          <div className="flex min-w-60 flex-1 items-center gap-3 sm:max-w-md">
            <Label htmlFor={sliderId} className="shrink-0">
              Width
            </Label>
            <Slider
              id={sliderId}
              aria-label={`${surfaceLabel(surface.name)} width`}
              min={min}
              max={min + RANGE}
              step={4}
              value={[width]}
              onValueChange={([next]) => setWidth(next ?? min)}
            />
            <output
              htmlFor={sliderId}
              className="w-14 shrink-0 text-end text-sm tabular-nums"
            >
              {width}px
            </output>
          </div>
        )}
      </div>
      {reasons.length > 0 ? (
        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium">
            {claimed
              ? `${spec.label} doesn't fit at this width.`
              : `${spec.label} doesn't go in a ${surfaceLabel(surface.name).toLowerCase()}.`}
          </p>
          <ul className="mt-1 list-disc ps-5 text-muted-foreground">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="overflow-x-auto p-px">
          {/* A dashed edge shows the surface's width. */}
          <div className="w-fit max-w-full outline-1 outline-border outline-dashed">
            <OccupantInSurface
              // A fresh occupant per sample, so its own state (a selection) resets.
              key={`${spec.name}-${sample}`}
              occupant={spec.name}
              surface={surface.name}
              example={sample}
              state={state}
              width={width}
              height={HEIGHT}
            />
          </div>
        </div>
      )}
    </section>
  );
}

interface WorkbenchProps {
  /** The occupant to open with, from ?occupant=. */
  initial: string | null;
}

function Workbench({ initial }: WorkbenchProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [name, setName] = useState(
    () =>
      OCCUPANT_SPECS.find((o) => o.spec.name === initial)?.spec.name ??
      OCCUPANT_SPECS[0]?.spec.name ??
      "",
  );
  const [sample, setSample] = useState<ExampleRole>("primary");
  const [state, setState] = useState<OccupantState>("ready");
  const spec = OCCUPANT_SPECS.find((o) => o.spec.name === name)?.spec;
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold">Occupant workbench</h1>
          <p className="text-sm text-muted-foreground">
            One occupant in each surface on its own, with no template.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Control
            label="Occupant"
            value={name}
            options={OCCUPANT_SPECS.map((o) => ({
              value: o.spec.name,
              label: o.spec.label,
            }))}
            onChange={setName}
          />
          <Control
            label="Sample"
            value={sample}
            options={EXAMPLE_ROLES.map((role) => ({
              value: role,
              label: role.replace(/^[a-z]/, (c) => c.toUpperCase()),
            }))}
            onChange={setSample}
          />
          <Control
            label="State"
            value={state}
            options={OCCUPANT_STATES.map((s) => ({
              value: s,
              label: s
                .replace("-", " ")
                .replace(/^[a-z]/, (c) => c.toUpperCase()),
            }))}
            onChange={setState}
          />
          <Control
            label="Theme"
            value={theme}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={setTheme}
          />
        </div>
      </header>
      {spec &&
        Object.keys(SURFACE_HOSTS).flatMap((surfaceName) =>
          SURFACE_SPECS.filter((s) => s.name === surfaceName).map((surface) => (
            <SurfaceBench
              // Each occupant starts every surface at its minimum.
              key={`${spec.name}-${surface.name}`}
              surface={surface}
              spec={spec}
              sample={sample}
              state={state}
            />
          )),
        )}
    </div>
  );
}

export default function OccupantWorkbenchPage() {
  // Client only, portaled to the body, with nothing that suspends: under the
  // docs layout, a full-screen client page otherwise stays hidden
  // (display: none) after hydration. So the query is read on mount.
  const [initial, setInitial] = useState<{ occupant: string | null }>();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitial({ occupant: params.get("occupant") });
  }, []);
  if (!initial) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-auto bg-background p-6 text-foreground not-prose">
      <Workbench initial={initial.occupant} />
    </div>,
    document.body,
  );
}
