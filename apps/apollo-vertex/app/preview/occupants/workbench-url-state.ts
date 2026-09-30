import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import {
  TEMPLATE_HOSTS,
  type TemplateHost,
} from "@/app/_components/template-hosts";
import { OCCUPANT_STATES, type OccupantState } from "@/components/ui/occupant";
import {
  type FitResult,
  fits,
  fitsSurface,
  type OccupantSpec,
  occupantInset,
  type SurfaceSpec,
} from "@/lib/composition";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { specFor } from "@/lib/occupant-lookup";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import type { PanelPlacement } from "@/templates/detail-page/detail-page.template";

/**
 * The whole workbench view as query params: occupant, surface, sample,
 * state, theme, width, list=closed, details=open, view=template, template,
 * slot, placement, page. Only non-default values are written; invalid ones
 * fall back to the defaults.
 */
export type WorkbenchTheme = "light" | "dark";
export type WorkbenchMode = "surface" | "template";

export interface WorkbenchView {
  occupant: string;
  surface: string;
  sample: ExampleRole;
  state: OccupantState;
  theme: WorkbenchTheme;
  width: number;
  listOpen: boolean;
  detailsOpen: boolean;
  mode: WorkbenchMode;
  template: string;
  slot: string;
  placement: PanelPlacement;
  pageWidth: number;
}

/** The page width slider's range; its start is each template's own minimum. */
export const PAGE_WIDTH_MAX = 1920;
const DEFAULT_PAGE_WIDTH = 1440;

/** Templates previews can render, in the hosts' order. */
export const TEMPLATE_NAMES: readonly string[] = Object.keys(TEMPLATE_HOSTS);

export const templateFor = (name: string): TemplateHost | undefined =>
  TEMPLATE_HOSTS[name];

/**
 * fits() for the occupant in a template slot: against each surface the
 * slot accepts, the first that fits, or the first one's reasons.
 */
export function slotFit(
  host: TemplateHost,
  slotName: string,
  spec: OccupantSpec,
): FitResult {
  const slot = host.spec.slots.find((s) => s.name === slotName);
  if (!slot) return { fits: false, reasons: [`No ${slotName} slot.`] };
  const results = slot.surfaces.flatMap((name) =>
    SURFACE_SPECS.filter((s) => s.name === name).map((surface) =>
      fits(slot, surface, spec),
    ),
  );
  return (
    results.find((result) => result.fits) ??
    results[0] ?? {
      fits: false,
      reasons: [`The ${slotName} slot takes no surface.`],
    }
  );
}

/** The first slot the occupant fits, or the first slot. */
export function defaultSlot(
  host: TemplateHost | undefined,
  spec: OccupantSpec | undefined,
): string {
  const slots = host?.spec.slots ?? [];
  const fitting = slots.find(
    (slot) => host && spec && slotFit(host, slot.name, spec).fits,
  );
  return (fitting ?? slots[0])?.name ?? "";
}

/** The slider's range, in px of the surface's outer width. */
export const WIDTH_RANGE = { min: 40, max: 1600 } as const;

/** How far a surface's width moves per step, on the slider and when measuring. */
export const WIDTH_STEP = 4;

/** Registered surfaces that previews can render, in the hosts' order. */
export const HOSTED_SURFACES: readonly SurfaceSpec[] = Object.keys(
  SURFACE_HOSTS,
).flatMap((name) => SURFACE_SPECS.filter((s) => s.name === name));

/** The first surface the occupant fits, or the first surface. */
export function defaultSurface(spec: OccupantSpec | undefined): string {
  const fitting = HOSTED_SURFACES.find(
    (surface) => spec && fitsSurface(surface, spec).fits,
  );
  return (fitting ?? HOSTED_SURFACES[0])?.name ?? "";
}

/**
 * Where the width starts: the surface's own minimum, or where the occupant
 * starts to fit when that's wider or the surface has none.
 */
export function defaultWidth(
  spec: OccupantSpec | undefined,
  surfaceName: string,
): number {
  const surface = SURFACE_SPECS.find((s) => s.name === surfaceName);
  const needs = spec ? spec.requires.minWidth + occupantInset(spec) : 0;
  return Math.max(surface?.width?.min ?? 0, needs, WIDTH_RANGE.min);
}

const DEFAULT_OCCUPANT = OCCUPANT_SPECS[0]?.spec.name ?? "";
const DEFAULT_TEMPLATE = TEMPLATE_NAMES[0] ?? "";

export function parseWorkbenchView(search: string): WorkbenchView {
  const params = new URLSearchParams(search);
  const occupant =
    specFor(params.get("occupant") ?? "")?.name ?? DEFAULT_OCCUPANT;
  const spec = specFor(occupant);
  const surface =
    HOSTED_SURFACES.find((s) => s.name === params.get("surface"))?.name ??
    defaultSurface(spec);
  const width = Number(params.get("width"));
  const template = templateFor(params.get("template") ?? "")
    ? (params.get("template") ?? DEFAULT_TEMPLATE)
    : DEFAULT_TEMPLATE;
  const host = templateFor(template);
  const slot =
    host?.spec.slots.find((s) => s.name === params.get("slot"))?.name ??
    defaultSlot(host, spec);
  const pageWidth = Number(params.get("page"));
  return {
    occupant,
    surface,
    sample: EXAMPLE_ROLES.find((r) => r === params.get("sample")) ?? "primary",
    state: OCCUPANT_STATES.find((s) => s === params.get("state")) ?? "ready",
    theme: params.get("theme") === "dark" ? "dark" : "light",
    width:
      Number.isInteger(width) &&
      width >= WIDTH_RANGE.min &&
      width <= WIDTH_RANGE.max
        ? width
        : defaultWidth(spec, surface),
    listOpen: params.get("list") !== "closed",
    detailsOpen: params.get("details") === "open",
    mode: params.get("view") === "template" ? "template" : "surface",
    template,
    slot,
    placement:
      params.get("placement") === "beside-header"
        ? "beside-header"
        : "below-header",
    pageWidth:
      Number.isInteger(pageWidth) &&
      pageWidth >= (host?.minWidth ?? 0) &&
      pageWidth <= PAGE_WIDTH_MAX
        ? pageWidth
        : DEFAULT_PAGE_WIDTH,
  };
}

export function serializeWorkbenchView(view: WorkbenchView): string {
  const spec = specFor(view.occupant);
  const params = new URLSearchParams();
  if (view.occupant !== DEFAULT_OCCUPANT) params.set("occupant", view.occupant);
  if (view.surface !== defaultSurface(spec))
    params.set("surface", view.surface);
  if (view.sample !== "primary") params.set("sample", view.sample);
  if (view.state !== "ready") params.set("state", view.state);
  if (view.theme !== "light") params.set("theme", view.theme);
  if (view.width !== defaultWidth(spec, view.surface))
    params.set("width", String(view.width));
  if (!view.listOpen) params.set("list", "closed");
  if (view.detailsOpen) params.set("details", "open");
  if (view.mode !== "surface") params.set("view", view.mode);
  if (view.template !== DEFAULT_TEMPLATE) params.set("template", view.template);
  if (view.slot !== defaultSlot(templateFor(view.template), spec))
    params.set("slot", view.slot);
  if (view.placement !== "below-header")
    params.set("placement", view.placement);
  if (view.pageWidth !== DEFAULT_PAGE_WIDTH)
    params.set("page", String(view.pageWidth));
  const query = params.toString();
  return query ? `?${query}` : "";
}
