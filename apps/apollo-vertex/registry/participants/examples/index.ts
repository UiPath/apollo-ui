/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * the participants with, by role. Primary is hiring,
 * secondary home renovation, and stress the data that breaks layouts.
 */
import type { OccupantExamples } from "@/lib/occupant-entry";
import type { ParticipantsViewModel } from "../participants.view-model";
import { PRIMARY } from "./primary.example-adapter";
import { SECONDARY } from "./secondary.example-adapter";
import { STRESS } from "./stress.example-adapter";

export const EXAMPLES: OccupantExamples<ParticipantsViewModel> = {
  primary: PRIMARY,
  secondary: SECONDARY,
  stress: STRESS,
};
