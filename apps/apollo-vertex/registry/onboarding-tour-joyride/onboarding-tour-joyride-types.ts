import type { ReactNode } from "react";

interface TourStep<TCondition extends string = string> {
  /** Unique step identifier */
  id: string;
  /** CSS selector for the target element. Omit for centered/modal steps. */
  selector?: string;
  /** Step title */
  title: string;
  /** Step body content */
  body: ReactNode;
  /** Optional tip/note to display */
  tip?: string;
  /** Popover placement relative to target */
  placement?: "top" | "bottom" | "left" | "right";
  /** Condition key that must be true before this step can be reached */
  waitFor?: TCondition;
  /** Custom label for the Next button */
  nextLabel?: string;
  /** Callback when this step becomes active */
  onEnter?: () => void;
  /** Step rendering type. 'modal' renders a welcome modal. Default: 'popover' */
  type?: "popover" | "modal";
  /** Image URL for modal-type steps */
  image?: string;
}

interface TourDefinition<TCondition extends string = string> {
  /** Unique tour identifier */
  id: string;
  /** Tour steps in order */
  steps: TourStep<TCondition>[];
}

export type { TourStep, TourDefinition };
