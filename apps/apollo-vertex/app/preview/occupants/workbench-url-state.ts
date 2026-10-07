import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import {
  TEMPLATE_HOSTS,
  type TemplateHost,
} from "@/app/_components/template-hosts";
import { OCCUPANT_STATES, type OccupantState } from "@/components/ui/occupant";
import {
  fitsSurface,
  type OccupantSpec,
  occupantInset,
  type SurfaceSpec,
} from "@/lib/composition";
import type { LayoutChoices } from "@/lib/layout";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { specFor } from "@/lib/occupant-lookup";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import type { PreviewShellVariant } from "@/templates/shell/PreviewShell";
import {
  normalizeContents,
  normalizeTabs,
  placeOccupant,
  type SlotContents,
  slotFit,
} from "./workbench-compose";
import {
  parseContents,
  parseTabs,
  writeContents,
  writeTabs,
} from "./workbench-contents-url";
import { parseLayout, writeLayout } from "./workbench-layout-url";
import type { Renames } from "./workbench-renames";
import {
  normalizeSamples,
  parseSamples,
  type Samples,
  writeSamples,
} from "./workbench-samples";

export { slotFit } from "./workbench-compose";

/**
 * The whole workbench view as query params: occupant, surface, sample,
 * state, theme, width, list=closed, details=open, view=template, template,
 * page, zoom=100, shell=minimal, mode=edit, and the template's layout, per
 * slot it declares choices for: <slot>-present=false, <slot>-state=closed,
 * and <slot>-placement, and what each slot holds and shows, <slot>-contents and <slot>-tab (see
 * workbench-contents-url). A template can map its older params onto these
 * (TemplateHost.legacyParams). Only non-default values are written;
 * unknown slots and invalid values fall back to the defaults.
 *
 * Each view owns its params, and only the current view's are read and
 * written. The surface view's are occupant, surface, width, sample, and
 * state. The template view's are view=template, template, shell, the
 * layout and contents, page, zoom, and mode; it has no focused occupant.
 * A template link from before that, with occupant or slot, places that
 * occupant once in its slot, as it did then (see parseWorkbenchView).
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
  /** The shell around the template. The page width includes it. */
  shell: PreviewShellVariant;
  /** The page's choices for the template's slots. */
  layout: LayoutChoices;
  /** What each slot holds. */
  contents: SlotContents;
  /** The tab each slot shows, when one was chosen. */
  tabs: Readonly<Record<string, string>>;
  pageWidth: number;
  zoom: WorkbenchZoom;
  /** Edit mode: slots outlined and opened by a click, occupants inert. */
  editing: boolean;
  /** Preview-only renames, for this session: never in the link. */
  renames: Renames;
  /** Each occupant's sample on the page, where it isn't primary. */
  samples: Samples;
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
 * The view as it can be: in the template view, each slot only what it can
 * hold; the page width in range.
 */
export function normalizeView(view: WorkbenchView): WorkbenchView {
  const host = templateFor(view.template);
  const inTemplate = view.mode === "template" && host;
  const contents = inTemplate
    ? normalizeContents(host, view.contents)
    : view.contents;
  return {
    ...view,
    ...(inTemplate && {
      contents,
      tabs: normalizeTabs(contents, view.tabs),
      samples: normalizeSamples(contents, view.samples),
    }),
    pageWidth: Math.max(view.pageWidth, pageWidthMin(host, view.shell)),
  };
}

/**
 * The contents with the occupant selected in the list placed in a slot:
 * when the template view starts with nothing on its page.
 */
export function seeded(
  host: TemplateHost | undefined,
  contents: SlotContents,
  occupant: string,
  slot = defaultSlot(host, specFor(occupant)),
): SlotContents {
  return host ? placeOccupant(host, contents, slot, occupant) : contents;
}

/**
 * The view switched to another mode. Into the template view with nothing
 * on its page, the occupant selected in the list goes in the first slot
 * it fits; back to the surface view, that occupant opens in its surface,
 * at that surface's start width.
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
  const empty = Object.keys(view.contents).length === 0;
  return normalizeView({
    ...view,
    mode,
    contents: empty ? seeded(host, {}, view.occupant) : view.contents,
  });
}

/**
 * A link from before the template view had no focused occupant: its slot
 * stays in the page and open, as the focus rule kept it.
 */
function keepOpen(
  host: TemplateHost | undefined,
  layout: LayoutChoices,
  slot: string,
): LayoutChoices {
  const own = host?.spec.layout.options?.[slot];
  if (!own?.optional && !own?.closable) return layout;
  return {
    ...layout,
    [slot]: {
      ...layout[slot],
      ...(own.optional && { present: true }),
      ...(own.closable && { open: true }),
    },
  };
}

/** Templates previews can render, in the registry's order. */
export const templateNames = (): readonly string[] =>
  Object.keys(TEMPLATE_HOSTS);

/** The template previews show first: the registry's first. */
export const defaultTemplate = () => templateNames()[0] ?? "";

export const templateFor = (name: string): TemplateHost | undefined =>
  TEMPLATE_HOSTS[name];

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
const SURFACE_PARAMS = ["surface", "width", "sample", "state"];
const TEMPLATE_PARAMS = [
  "template",
  "slot",
  "shell",
  "page",
  "zoom",
  "mode",
  "samples",
];

export function parseWorkbenchView(search: string): WorkbenchView {
  const params = new URLSearchParams(search);
  const mode: WorkbenchMode =
    params.get("view") === "template" ? "template" : "surface";
  // A template link that names an occupant or a slot is from when the
  // template view had a focused occupant: it's placed, once, where it was.
  const legacy =
    mode === "template" && (params.has("occupant") || params.has("slot"));
  const slotParam = params.get("slot");
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
    host?.spec.slots.find((s) => s.name === slotParam)?.name ??
    defaultSlot(host, spec);
  const layout = mode === "template" ? parseLayout(host, params) : {};
  const contents = mode === "template" ? parseContents(host, params) : {};
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
    shell,
    layout: legacy ? keepOpen(host, layout, slot) : layout,
    contents: legacy ? seeded(host, contents, occupant, slot) : contents,
    tabs: mode === "template" ? parseTabs(host, params) : {},
    samples: mode === "template" ? parseSamples(params) : {},
    pageWidth:
      Number.isInteger(pageWidth) &&
      pageWidth >= pageWidthMin(host, shell) &&
      pageWidth <= PAGE_WIDTH_MAX
        ? pageWidth
        : DEFAULT_PAGE_WIDTH,
    zoom: params.get("zoom") === "100" ? "actual" : "fit",
    editing: params.get("mode") === "edit",
    // A link never carries renames: a reload shows the declared titles.
    renames: {},
  });
}

/** The template view's own params: only what isn't the default. */
function writeTemplateParams(view: WorkbenchView, params: URLSearchParams) {
  params.set("view", view.mode);
  if (view.template !== defaultTemplate())
    params.set("template", view.template);
  if (view.shell !== "sidebar") params.set("shell", view.shell);
  writeLayout(templateFor(view.template), view.layout, params);
  writeContents(templateFor(view.template), view.contents, params);
  writeTabs(view.contents, view.tabs, params);
  writeSamples(view.samples, params);
  if (view.pageWidth !== DEFAULT_PAGE_WIDTH)
    params.set("page", String(view.pageWidth));
  if (view.zoom !== "fit") params.set("zoom", "100");
  if (view.editing) params.set("mode", "edit");
}

export function serializeWorkbenchView(view: WorkbenchView): string {
  const spec = specFor(view.occupant);
  const params = new URLSearchParams();
  const inTemplate = view.mode === "template";
  // The occupant, its sample, and its state are the surface view's.
  if (!inTemplate && view.occupant !== DEFAULT_OCCUPANT)
    params.set("occupant", view.occupant);
  if (!inTemplate && view.surface !== defaultSurface(spec))
    params.set("surface", view.surface);
  if (!inTemplate && view.sample !== "primary")
    params.set("sample", view.sample);
  if (!inTemplate && view.state !== "ready") params.set("state", view.state);
  if (view.theme !== "light") params.set("theme", view.theme);
  if (!inTemplate && view.width !== defaultWidth(spec, view.surface))
    params.set("width", String(view.width));
  if (!view.listOpen) params.set("list", "closed");
  if (view.detailsOpen) params.set("details", "open");
  if (inTemplate) writeTemplateParams(view, params);
  // A colon and a tilde need no escaping in a query, and links with
  // contents read better without.
  const query = params.toString().replaceAll("%3A", ":").replaceAll("%7E", "~");
  return query ? `?${query}` : "";
}
