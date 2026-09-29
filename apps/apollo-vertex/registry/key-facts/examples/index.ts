/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * key facts with, keyed by example name. "stress" is required.
 */
import type { KeyFactsViewModel } from "../key-facts.view-model";
import { SHIPMENT } from "./shipment.example-adapter";
import { STRESS } from "./stress.example-adapter";
import { SUPPORT_CASE } from "./support-case.example-adapter";

export const EXAMPLES: Record<string, KeyFactsViewModel> = {
  shipment: SHIPMENT,
  "support-case": SUPPORT_CASE,
  stress: STRESS,
};
