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
import {
  defaultPlacement,
  type LayoutChoices,
  type SlotChoice,
} from "@/lib/layout";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { specFor } from "@/lib/occupant-lookup";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import { withFocus } from "./workbench-layout";

/**
 * The whole workbench view as query params: occupant, surface, sample,
 * state, theme, width, list=closed, details=open, view=template, template,
 * slot, page, zoom=100, shell=minimal, and the template's layout, per
 * slot it declares choices for: <slot>-present=false, <slot>-state=closed,
 * and <slot>-placement. A template can map its older params onto these
 * (TemplateHost.legacyParams). Only non-default values are written;
 * unknown slots and invalid values fall back to the defaults.
 *
 * Each view owns its params, and only the current view's are read and
 * written. The surface view's are surface and width. The template view's
 * are view=template, template, slot, shell, the layout, page, and zoom;
 * there the surface comes from the slot. So a link never carries a
 * surface and a slot that disagree.
 */
export type WorkbenchTheme = "light" | "dark";
export type WorkbenchMode = "surface" | "template";
/** The template view's zoom: scaled to fit the stage, or at its real size. */
export type WorkbenchZoom = "fit" | "actual";

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
  /** The shell around the template. The page width includes it. */
  shell: PreviewShellVariant;
  /** The page's choices for the template's slots. */
  layout: LayoutChoices;
  pageWidth: number;
  zoom: WorkbenchZoom;
}

/**
 * The page width slider's range. It's the whole window, shell included, so
 * its start is the template's own minimum plus the shell's width.
 */
export const PAGE_WIDTH_MAX = 1920;
const DEFAULT_PAGE_WIDTH = 1440;

/** How wide each shell is beside the page: ApolloShell's --sidebar-width. */
export const SHELL_WIDTH: Record<PreviewShellVariant, number> = {
  sidebar: 280,
  minimal: 0,
};

export const pageWidthMin = (
  host: TemplateHost | undefined,
  shell: PreviewShellVariant,
): number => (host?.minWidth ?? 0) + SHELL_WIDTH[shell];

/**
 * The view as it can be: in the template view, the surface is the slot's,
 * and the occupant's slot is kept there and open (the focus rule); the
 * width is in range.
 */
export function normalizeView(view: WorkbenchView): WorkbenchView {
  const host = templateFor(view.template);
  const spec = specFor(view.occupant);
  const inTemplate = view.mode === "template" && host;
  return {
    ...view,
    ...(inTemplate && { surface: slotSurface(host, view.slot, spec) }),
    layout: host ? withFocus(host.spec, view.layout, view.slot) : view.layout,
    pageWidth: Math.max(view.pageWidth, pageWidthMin(host, view.shell)),
  };
}

/**
 * The surface a slot shows the occupant in: one it accepts that the
 * occupant fits there, else the first it accepts that previews host.
 */
export function slotSurface(
  host: TemplateHost,
  slotName: string,
  spec: OccupantSpec | undefined,
): string {
  const slot = host.spec.slots.find((s) => s.name === slotName);
  const accepted = HOSTED_SURFACES.filter((surface) =>
    slot?.surfaces.includes(surface.name),
  );
  const fitting = accepted.find(
    (surface) => slot && spec && fits(slot, surface, spec).fits,
  );
  return (fitting ?? accepted[0])?.name ?? defaultSurface(spec);
}

/**
 * The view switched to another mode, carrying the occupant's place over:
 * into the template view at a slot that takes its surface, and back to
 * the surface view in its slot's surface, at that surface's start width.
 */
export function switchView(
  view: WorkbenchView,
  mode: WorkbenchMode,
): WorkbenchView {
  if (mode === view.mode) return view;
  const spec = specFor(view.occupant);
  if (mode === "surface")
    return { ...view, mode, width: defaultWidth(spec, view.surface) };
  const host = templateFor(view.template);
  const taking = host?.spec.slots.find(
    (slot) =>
      slot.surfaces.includes(view.surface) &&
      spec &&
      slotFit(host, slot.name, spec).fits,
  );
  return normalizeView({
    ...view,
    mode,
    slot: taking?.name ?? defaultSlot(host, spec),
  });
}

/** Templates previews can render, in the registry's order. */
export const templateNames = (): readonly string[] =>
  Object.keys(TEMPLATE_HOSTS);

/** The template previews show first: the registry's first. */
export const defaultTemplate = () => templateNames()[0] ?? "";

/**
 * A template's layout choices from link params: per slot it declares
 * choices for, whether it's left out, closed, and where it's placed. The
 * template's older params count where the link gives no per-slot ones.
 */
function parseLayout(
  host: TemplateHost | undefined,
  params: URLSearchParams,
): LayoutChoices {
  if (!host) return {};
  const legacy = host.legacyParams?.(params) ?? {};
  const get = (key: string) => params.get(key) ?? legacy[key] ?? null;
  const options = host.spec.layout.options ?? {};
  return Object.fromEntries(
    Object.entries(options).flatMap(([slot, own]) => {
      const choice: SlotChoice = {
        ...(own.optional &&
          get(`${slot}-present`) === "false" && { present: false }),
        ...(own.closable &&
          get(`${slot}-state`) === "closed" && { open: false }),
      };
      const placement = get(`${slot}-placement`);
      const placed =
        placement &&
        placement !== defaultPlacement(host.spec, slot) &&
        own.placements?.[placement]
          ? { placement }
          : {};
      const all = { ...choice, ...placed };
      return Object.keys(all).length > 0 ? [[slot, all]] : [];
    }),
  );
}

/** The params for a template's layout choices: only what isn't the default. */
function writeLayout(
  host: TemplateHost | undefined,
  layout: LayoutChoices,
  params: URLSearchParams,
) {
  if (!host) return;
  for (const [slot, own] of Object.entries(host.spec.layout.options ?? {})) {
    const choice = layout[slot] ?? {};
    if (own.optional && choice.present === false)
      params.set(`${slot}-present`, "false");
    if (own.closable && choice.open === false)
      params.set(`${slot}-state`, "closed");
    if (
      choice.placement &&
      choice.placement !== defaultPlacement(host.spec, slot) &&
      own.placements?.[choice.placement]
    )
      params.set(`${slot}-placement`, choice.placement);
  }
}

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

/** The params only one view reads and writes. */
const SURFACE_PARAMS = ["surface", "width"];
const TEMPLATE_PARAMS = ["template", "slot", "shell", "page", "zoom"];

export function parseWorkbenchView(search: string): WorkbenchView {
  const params = new URLSearchParams(search);
  const mode: WorkbenchMode =
    params.get("view") === "template" ? "template" : "surface";
  // Only the current view's own params count.
  for (const key of mode === "template" ? SURFACE_PARAMS : TEMPLATE_PARAMS)
    params.delete(key);
  const occupant =
    specFor(params.get("occupant") ?? "")?.name ?? DEFAULT_OCCUPANT;
  const spec = specFor(occupant);
  const surface =
    HOSTED_SURFACES.find((s) => s.name === params.get("surface"))?.name ??
    defaultSurface(spec);
  const width = Number(params.get("width"));
  const template = templateFor(params.get("template") ?? "")
    ? (params.get("template") ?? defaultTemplate())
    : defaultTemplate();
  const host = templateFor(template);
  const slot =
    host?.spec.slots.find((s) => s.name === params.get("slot"))?.name ??
    defaultSlot(host, spec);
  const pageWidth = Number(params.get("page"));
  const shell: PreviewShellVariant =
    params.get("shell") === "minimal" ? "minimal" : "sidebar";
  return normalizeView({
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
    mode,
    template,
    slot,
    shell,
    layout: mode === "template" ? parseLayout(host, params) : {},
    pageWidth:
      Number.isInteger(pageWidth) &&
      pageWidth >= pageWidthMin(host, shell) &&
      pageWidth <= PAGE_WIDTH_MAX
        ? pageWidth
        : DEFAULT_PAGE_WIDTH,
    zoom: params.get("zoom") === "100" ? "actual" : "fit",
  });
}

/** The template view's own params: only what isn't the default. */
function writeTemplateParams(
  view: WorkbenchView,
  spec: OccupantSpec | undefined,
  params: URLSearchParams,
) {
  params.set("view", view.mode);
  if (view.template !== defaultTemplate())
    params.set("template", view.template);
  if (view.slot !== defaultSlot(templateFor(view.template), spec))
    params.set("slot", view.slot);
  if (view.shell !== "sidebar") params.set("shell", view.shell);
  writeLayout(templateFor(view.template), view.layout, params);
  if (view.pageWidth !== DEFAULT_PAGE_WIDTH)
    params.set("page", String(view.pageWidth));
  if (view.zoom !== "fit") params.set("zoom", "100");
}

export function serializeWorkbenchView(view: WorkbenchView): string {
  const spec = specFor(view.occupant);
  const params = new URLSearchParams();
  if (view.occupant !== DEFAULT_OCCUPANT) params.set("occupant", view.occupant);
  const inTemplate = view.mode === "template";
  if (!inTemplate && view.surface !== defaultSurface(spec))
    params.set("surface", view.surface);
  if (view.sample !== "primary") params.set("sample", view.sample);
  if (view.state !== "ready") params.set("state", view.state);
  if (view.theme !== "light") params.set("theme", view.theme);
  if (!inTemplate && view.width !== defaultWidth(spec, view.surface))
    params.set("width", String(view.width));
  if (!view.listOpen) params.set("list", "closed");
  if (view.detailsOpen) params.set("details", "open");
  if (inTemplate) writeTemplateParams(view, spec, params);
  const query = params.toString();
  return query ? `?${query}` : "";
}
