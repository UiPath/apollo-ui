/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * the queue with, by role. Primary is invoice exceptions,
 * secondary customer support, and stress the data that breaks layouts.
 */
import type { OccupantExamples } from "@/lib/occupant-entry";
import type { QueueViewModel } from "../queue.view-model";
import { PRIMARY } from "./primary.example-adapter";
import { SECONDARY } from "./secondary.example-adapter";
import { STRESS } from "./stress.example-adapter";

export const EXAMPLES: OccupantExamples<QueueViewModel> = {
  primary: PRIMARY,
  secondary: SECONDARY,
  stress: STRESS,
};
