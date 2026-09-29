/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * this occupant with, one per example adapter, keyed by example name.
 */
import type { ProgressViewModel } from "@/lib/progress-view-model";
import { CLAIM_PROGRESS } from "@/registry/progress-view-model/examples/claim-appeal.example-adapter";
import { INVOICE_PROGRESS } from "@/registry/progress-view-model/examples/invoice.example-adapter";
import { STRESS_PROGRESS } from "@/registry/progress-view-model/examples/stress.example-adapter";

export const EXAMPLES: Record<string, ProgressViewModel> = {
  invoice: INVOICE_PROGRESS,
  "claim-appeal": CLAIM_PROGRESS,
  stress: STRESS_PROGRESS,
};
