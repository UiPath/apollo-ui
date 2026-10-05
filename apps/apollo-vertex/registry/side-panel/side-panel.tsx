"use client";

import { cva } from "class-variance-authority";
import * as React from "react";

import { useScrollFade } from "@/hooks/use-scroll-fade";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import {
  type PanelSpec,
  panelMinWidth,
  resolvePanel,
  validatePanel,
} from "@/lib/panel";
import { SurfaceProvider, useSurfaceFrame } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import { sidePanelSurface } from "./side-panel.surface";
import { BODY_FOCUS_RING, sidePanelBodyVariants } from "./side-panel-body";
import {
  type SidePanelOccupant,
  type SidePanelOccupants,
  SidePanelTabs,
  type StackHeadingLevel,
  tabLayout,
} from "./side-panel-tabs";

// The background follows placement only, so the rules are !important:
// neither a className nor an inline style can set it. Beside-header panels
// get the translucent --side-panel-tint over the Shell's ambient layer;
// every other panel stays transparent.
const sidePanelVariants = cva(
  [
    "flex h-full w-(--side-panel-width) min-h-0 shrink-0 flex-col [--side-panel-width:var(--side-panel-width-min)]",
    "bg-transparent! bg-none! data-[placement=beside-header]:bg-side-panel-tint!",
    BODY_FOCUS_RING,
  ].join(" "),
);

type SidePanelPlacement = "below-header" | "beside-header";

interface SidePanelSlotState {
  open: boolean;
  placement: SidePanelPlacement;
  /**
   * The panel reports its narrowest outer width here: its widest
   * occupant's minimum plus its inset, across every tab. The template
   * sizes the slot to at least that.
   */
  onMinWidth?: (px: number) => void;
}

/**
 * Lets a template tell the panel in its slot whether it is open and where
 * it sits, so data-state and data-placement always match the layout.
 */
const SidePanelSlotContext = React.createContext<SidePanelSlotState | null>(
  null,
);

interface SidePanelProps extends React.ComponentProps<"aside"> {
  /** Which edge of the template the panel sits on. Logical, so it flips in RTL. */
  side: "start" | "end";
  /** Set from the occupant's spec. Defaults to "padded". */
  padding?: SurfacePadding;
  /**
   * Who scrolls, from the occupant's spec. "surface" (default): the panel
   * body scrolls and fades. "occupant": the panel neither scrolls nor
   * fades, and gives the occupant its full height to scroll itself.
   */
  scroll?: ScrollOwner;
  /**
   * Take the whole width it's given, instead of its own width. For a panel
   * outside a template, like a preview. In a template's slot it always
   * fills: the template sizes the slot.
   */
  fill?: boolean;
  /** Names the landmark for assistive tech. */
  "aria-label": string;
  /**
   * Tabs and stacks: what the panel holds (see @/lib/panel), with every
   * occupant it names in `occupants`. Each tab's padding and scrolling
   * follow its occupants' specs, so `padding` and `scroll` are ignored.
   * Without it, the panel holds `children`, one occupant.
   */
  panel?: PanelSpec;
  /** The occupants `panel` names, by name: each one's spec and content. */
  occupants?: SidePanelOccupants;
  /** The level of a stack's headings. Defaults to 2. */
  headingLevel?: StackHeadingLevel;
  /**
   * The tab to show first, by id, as from a link. An unknown id shows the
   * first tab. The panel owns which tab shows after that.
   */
  defaultTab?: string;
  /** Called with a tab's id when someone switches to it. */
  onTabChange?: (id: string) => void;
}

function SidePanel({
  panel,
  occupants,
  headingLevel,
  defaultTab,
  onTabChange,
  ...props
}: SidePanelProps) {
  if (panel)
    return (
      <TabbedSidePanel
        panel={panel}
        occupants={occupants ?? {}}
        headingLevel={headingLevel ?? 2}
        {...(defaultTab && { defaultTab })}
        {...(onTabChange && { onTabChange })}
        {...props}
      />
    );
  return <SingleSidePanel {...props} />;
}

type SidePanelFrameProps = Omit<
  SidePanelProps,
  "panel" | "occupants" | "headingLevel" | "defaultTab" | "onTabChange"
>;

/** The <aside> every side panel renders, with its layer attributes. */
function SidePanelAside({
  side,
  padding,
  scroll,
  fill = false,
  className,
  children,
  ...props
}: SidePanelFrameProps & { padding: SurfacePadding; scroll: ScrollOwner }) {
  const slot = React.useContext(SidePanelSlotContext);
  const open = slot?.open ?? true;
  const placement = slot?.placement ?? "below-header";
  const fills = fill || slot !== null;
  return (
    <aside
      data-surface={sidePanelSurface.name}
      data-side={side}
      data-padding={padding}
      data-state={open ? "open" : "closed"}
      data-placement={placement}
      data-scroll={scroll}
      className={cn(
        sidePanelVariants(),
        fills && "w-full [--side-panel-width:100%]",
        className,
      )}
      {...props}
    >
      {/* A panel nested in this one isn't in the template's slot. */}
      <SidePanelSlotContext.Provider value={null}>
        {children}
      </SidePanelSlotContext.Provider>
    </aside>
  );
}

interface TabbedSidePanelProps extends SidePanelFrameProps {
  panel: PanelSpec;
  occupants: SidePanelOccupants;
  headingLevel: StackHeadingLevel;
  defaultTab?: string;
  onTabChange?: (id: string) => void;
}

/**
 * A panel of tabs and stacks. It checks the panel against its occupants'
 * specs, and throws on any broken rule. It owns which tab is showing.
 */
function TabbedSidePanel({
  panel,
  occupants,
  headingLevel,
  defaultTab,
  onTabChange,
  children: _children,
  ...props
}: TabbedSidePanelProps) {
  const [chosen, setChosen] = React.useState<string | null>(defaultTab ?? null);
  const choose = (id: string) => {
    setChosen(id);
    onTabChange?.(id);
  };
  const specs = Object.values(occupants).map((o) => o.spec);
  const errors = validatePanel(panel, specs);
  if (errors.length > 0) throw new Error(`SidePanel: ${errors.join(" ")}`);
  const resolved = resolvePanel(panel, specs);
  // One width for every tab, so switching never resizes the panel.
  const minWidth = panelMinWidth(sidePanelSurface, resolved);
  const report = React.useContext(SidePanelSlotContext)?.onMinWidth;
  React.useLayoutEffect(() => report?.(minWidth), [report, minWidth]);
  const first = resolved.tabs[0]?.id ?? "";
  const active =
    chosen !== null && resolved.tabs.some((tab) => tab.id === chosen)
      ? chosen
      : first;
  const activeTab = resolved.tabs.find((tab) => tab.id === active);
  const layout = activeTab
    ? tabLayout(activeTab)
    : { padding: "padded" as const, scroll: "surface" as const };
  return (
    <SidePanelAside {...props} padding={layout.padding} scroll={layout.scroll}>
      <SidePanelTabs
        panel={resolved}
        occupants={occupants}
        headingLevel={headingLevel}
        active={active}
        onActiveChange={choose}
      />
    </SidePanelAside>
  );
}

/** A panel that holds one occupant, its children. */
function SingleSidePanel({
  padding = "padded",
  scroll = "surface",
  children,
  ...props
}: SidePanelFrameProps) {
  const frame = useSurfaceFrame<HTMLDivElement>(
    sidePanelSurface.provides.orientation,
  );
  // While it scrolls, the body takes keyboard focus so it can be scrolled.
  const bodyRef = useScrollFade<HTMLDivElement>(
    scroll === "surface",
    frame.ref,
    {
      focusable: true,
    },
  );
  return (
    <SidePanelAside {...props} padding={padding} scroll={scroll}>
      <div
        ref={bodyRef}
        data-slot="side-panel-body"
        className={sidePanelBodyVariants({ padding, scroll })}
      >
        <SurfaceProvider value={frame.value}>{children}</SurfaceProvider>
      </div>
    </SidePanelAside>
  );
}

export { SidePanel, SidePanelSlotContext };
export type {
  SidePanelOccupant,
  SidePanelOccupants,
  SidePanelPlacement,
  SidePanelProps,
  SidePanelSlotState,
  StackHeadingLevel,
};
