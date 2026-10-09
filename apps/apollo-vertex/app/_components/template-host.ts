import type { ComponentType, ReactNode } from "react";
import type { OccupantSpec, TemplateSpec } from "@/lib/composition";
import type { LayoutChoices } from "@/lib/layout";
import type { PanelSpec } from "@/lib/panel";

/** What a slot ended up as after the template's own rules. */
export interface SlotStatus {
  open: boolean;
  /** Why it's closed: the page's choice, or the template's rule. Null when open or not there. */
  closedBy: "user" | "rule" | null;
}

/** What one slot holds in a preview: its panel, and each occupant in it. */
export interface SlotContent {
  /** One tab of one occupant, or tabs and stacks in a slot that holds a panel. */
  panel: PanelSpec;
  /** Each occupant the panel names: its spec, and it rendered. */
  occupants: Readonly<Record<string, { spec: OccupantSpec; node: ReactNode }>>;
  /** The tab it shows first. */
  defaultTab: string;
  /** Called with the tab's id when another is chosen. */
  onTabChange?: (id: string) => void;
  /**
   * Changes when the preview picks the tab to show: the panel starts again
   * on `defaultTab`. Choosing a tab in the panel doesn't change it.
   */
  revision?: number;
}

/** What a preview gives a template: what each slot holds, and the layout. */
export interface TemplateFrameProps {
  /** What each slot holds; a slot left out shows a placeholder. */
  contents: Readonly<Record<string, SlotContent>>;
  /** The page's choices for the template's slots (see resolveLayout). */
  choices: LayoutChoices;
  /** Called with each slot's state after the template's rules, as it changes. */
  onStatus?: (status: Readonly<Record<string, SlotStatus>>) => void;
}

/**
 * How previews render one template: its spec, which declares its slots,
 * their rules, and its layout, and a frame that renders it. Nothing else
 * about the template is the workbench's to know.
 */
export interface TemplateHost {
  spec: TemplateSpec;
  /** What people call it, in sentence case. */
  label: string;
  /** Each slot's name, in sentence case. */
  slotLabels: Readonly<Record<string, string>>;
  /** The narrowest page width where the template still works, in px. */
  minWidth: number;
  /** Renders the template with one occupant in one slot. */
  Frame: ComponentType<TemplateFrameProps>;
  /**
   * Maps link params the template used before per-slot params, so old
   * links still open the same layout: returns per-slot params
   * (<slot>-present, <slot>-state, <slot>-placement) to use where the link
   * gives none of its own.
   */
  legacyParams?: (params: URLSearchParams) => Readonly<Record<string, string>>;
}
