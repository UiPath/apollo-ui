interface TourStep {
  /** Unique step identifier */
  id: string;
  /** CSS selector for the target element. Omit for a centered popover (e.g. welcome). */
  selector?: string;
  /** Step title (plain string; rendered by driver.js native popover) */
  title: string;
  /**
   * Step description. driver.js's native popover accepts HTML strings,
   * so plain text works and basic HTML (e.g. `<strong>`, `<em>`) is supported.
   */
  description: string;
  /** Popover placement relative to target */
  placement?: "top" | "bottom" | "left" | "right";
  /** Callback when this step becomes active */
  onEnter?: () => void;
}

interface TourDefinition {
  /** Unique tour identifier */
  id: string;
  /** Tour steps in order */
  steps: TourStep[];
}

export type { TourDefinition, TourStep };
