import type { ComponentType, ReactNode } from "react";
import type { OccupantSpec, TemplateSpec } from "@/lib/composition";
import type { LayoutChoices } from "@/lib/layout";

/** What a slot ended up as after the template's own rules. */
export interface SlotStatus {
  open: boolean;
  /** Why it's closed: the page's choice, or the template's rule. Null when open or not there. */
  closedBy: "user" | "rule" | null;
}

/** What a preview gives a template to hold one occupant in one slot. */
export interface TemplateFrameProps {
  /** The slot the occupant goes in. */
  slot: string;
  /** The occupant's spec, for its padding and scroll owner. */
  spec: OccupantSpec;
  /** The occupant, rendered. */
  occupant: ReactNode;
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
