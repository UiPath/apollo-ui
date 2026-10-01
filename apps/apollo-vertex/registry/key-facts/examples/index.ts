/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * key facts with, by role. Primary is shipment tracking, secondary customer
 * support, and stress the data that breaks layouts.
 */
import type { OccupantExamples } from "@/lib/occupant-entry";
import type { KeyFactsViewModel } from "../key-facts.view-model";
import { SHIPMENT } from "./shipment.example-adapter";
import { STRESS } from "./stress.example-adapter";
import { SUPPORT_CASE } from "./support-case.example-adapter";

export const EXAMPLES: OccupantExamples<KeyFactsViewModel> = {
  primary: SHIPMENT,
  secondary: SUPPORT_CASE,
  stress: STRESS,
};
