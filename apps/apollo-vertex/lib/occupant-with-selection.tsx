import { type ComponentType, useState } from "react";
import type {
  OccupantSelectionProps,
  OccupantViewProps,
} from "@/components/ui/occupant";

/** A registered occupant's component: its view props, and selection if it picks items. */
export type EntryComponent<ViewModel> = ComponentType<
  OccupantViewProps<ViewModel> & OccupantSelectionProps
>;

/**
 * Stands in for the page: it holds which item is current, so previews and
 * checks can pick items and step through them. Occupants that don't select
 * ignore the props.
 */
export function WithSelection<ViewModel>({
  Component,
  ...props
}: OccupantViewProps<ViewModel> & { Component: EntryComponent<ViewModel> }) {
  const [currentId, setCurrentId] = useState<string>();
  return <Component {...props} currentId={currentId} onSelect={setCurrentId} />;
}
