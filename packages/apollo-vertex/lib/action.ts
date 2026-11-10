import type { ComponentType } from "react";

/** Something the user can do, such as a button. How it renders is up to the component. */
export interface Action {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** An icon component, e.g. one from `lucide-react`. */
  icon?: ComponentType<{ className?: string }>;
}
