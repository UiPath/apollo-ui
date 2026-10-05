"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScrollFade } from "@/hooks/use-scroll-fade";
import {
  type OccupantSpec,
  occupantPadding,
  occupantSizing,
  type ScrollOwner,
  type SurfacePadding,
  scrollOwner,
} from "@/lib/composition";
import type { ResolvedOccupant, ResolvedPanel, ResolvedTab } from "@/lib/panel";
import { SurfaceProvider, useSurfaceFrame } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import { sidePanelSurface } from "./side-panel.surface";
import { BODY_FOCUS_RING, sidePanelBodyVariants } from "./side-panel-body";

/** An occupant a panel names: its spec, and what to render for it. */
interface SidePanelOccupant {
  spec: OccupantSpec;
  node: React.ReactNode;
}

/** The occupants a panel names, by occupant name. */
type SidePanelOccupants = Readonly<Record<string, SidePanelOccupant>>;

/** The level of a stack's headings: one below the heading the panel sits under. */
type StackHeadingLevel = 2 | 3 | 4 | 5 | 6;

const { orientation } = sidePanelSurface.provides;

/** Who scrolls a tab and how it's padded: its only occupant's, or a stack's. */
function tabLayout(tab: ResolvedTab): {
  scroll: ScrollOwner;
  padding: SurfacePadding;
} {
  const only = tab.occupants.length === 1 ? tab.occupants[0] : null;
  if (!only) return { scroll: "surface", padding: "flush" };
  const scroll =
    occupantSizing(only.spec) === "fill"
      ? "occupant"
      : scrollOwner(sidePanelSurface, only.spec);
  return { scroll, padding: occupantPadding(only.spec) };
}

interface StackedOccupantProps {
  occupant: ResolvedOccupant;
  headingLevel: StackHeadingLevel;
  children: React.ReactNode;
}

/** One occupant in a stack: its heading, then the occupant in its own space. */
function StackedOccupant({
  occupant,
  headingLevel,
  children,
}: StackedOccupantProps) {
  const { t } = useTranslation();
  const headingId = React.useId();
  const frame = useSurfaceFrame<HTMLDivElement>(orientation);
  const Heading = `h${headingLevel}` as const;
  const flush = occupantPadding(occupant.spec) === "flush";
  return (
    <section
      data-part="stack-item"
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col gap-2 border-b border-border last:border-b-0",
        flush ? "py-(--surface-inset)" : "p-(--surface-inset)",
      )}
    >
      <Heading
        id={headingId}
        className={cn(
          "text-sm font-semibold text-foreground",
          flush && "px-(--surface-inset)",
        )}
      >
        {occupant.title ? t(occupant.title) : null}
      </Heading>
      <div ref={frame.ref} className="flex flex-col">
        <SurfaceProvider value={frame.value}>{children}</SurfaceProvider>
      </div>
    </section>
  );
}

interface TabBodyProps {
  tab: ResolvedTab;
  occupants: SidePanelOccupants;
  headingLevel: StackHeadingLevel;
  active: boolean;
  /** Inside a tablist: rendered as that tab's panel. */
  inTabs: boolean;
}

/**
 * One tab's body: the scroll container for a flow tab, with its own scroll
 * fades, or the occupant's space for a tab the occupant scrolls. It keeps
 * its scroll position while another tab is showing.
 */
function TabBody({
  tab,
  occupants,
  headingLevel,
  active,
  inTabs,
}: TabBodyProps) {
  const { scroll, padding } = tabLayout(tab);
  const stacked = tab.occupants.length > 1;
  const node = React.useRef<HTMLDivElement | null>(null);
  const frame = useSurfaceFrame<HTMLDivElement>(orientation, node);
  // A tab's panel is focusable already, so the fade never sets tabindex.
  const ref = useScrollFade<HTMLDivElement>(
    scroll === "surface",
    stacked ? node : frame.ref,
    { focusable: !inTabs },
  );
  const scrollTop = React.useRef(0);
  React.useLayoutEffect(() => {
    if (active && node.current) node.current.scrollTop = scrollTop.current;
  }, [active]);

  const content = stacked ? (
    tab.occupants.map((occupant) => (
      <StackedOccupant
        key={occupant.spec.name}
        occupant={occupant}
        headingLevel={headingLevel}
      >
        {occupants[occupant.spec.name]?.node}
      </StackedOccupant>
    ))
  ) : (
    <SurfaceProvider value={frame.value}>
      {occupants[tab.occupants[0]?.spec.name ?? ""]?.node}
    </SurfaceProvider>
  );
  const body = {
    ref,
    "data-slot": "side-panel-body",
    "data-tab": tab.id,
    "data-padding": padding,
    "data-scroll": scroll,
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      scrollTop.current = event.currentTarget.scrollTop;
    },
    className: sidePanelBodyVariants({ padding, scroll }),
  };
  if (!inTabs) return <div {...body}>{content}</div>;
  return (
    <TabsContent value={tab.id} forceMount hidden={!active} {...body}>
      {content}
    </TabsContent>
  );
}

interface SidePanelTabsProps {
  panel: ResolvedPanel;
  occupants: SidePanelOccupants;
  headingLevel: StackHeadingLevel;
  active: string;
  onActiveChange: (id: string) => void;
}

/**
 * A side panel's tabs. One tab is just its body, with no tab bar. More
 * than one is a tablist and a panel for each tab. Switching is instant.
 */
function SidePanelTabs({
  panel,
  occupants,
  headingLevel,
  active,
  onActiveChange,
}: SidePanelTabsProps) {
  const { t } = useTranslation();
  const [only] = panel.tabs;
  if (panel.tabs.length === 1 && only) {
    return (
      <TabBody
        tab={only}
        occupants={occupants}
        headingLevel={headingLevel}
        active
        inTabs={false}
      />
    );
  }
  return (
    <Tabs
      value={active}
      onValueChange={onActiveChange}
      className={cn("min-h-0 flex-1 gap-0", BODY_FOCUS_RING)}
    >
      <div
        data-part="tab-bar"
        className="shrink-0 px-(--surface-inset) pt-(--surface-inset)"
      >
        <TabsList className="w-full justify-start">
          {panel.tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-none">
              {tab.label ? t(tab.label) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {panel.tabs.map((tab) => (
        <TabBody
          key={tab.id}
          tab={tab}
          occupants={occupants}
          headingLevel={headingLevel}
          active={tab.id === active}
          inTabs
        />
      ))}
    </Tabs>
  );
}

export { SidePanelTabs, tabLayout };
export type { SidePanelOccupant, SidePanelOccupants, StackHeadingLevel };
