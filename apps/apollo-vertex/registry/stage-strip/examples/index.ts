/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * this occupant with, by role. Primary is invoice processing, secondary a
 * claim appeal, and stress the data that breaks layouts.
 */
import type { OccupantExamples } from "@/lib/occupant-entry";
import type { ProgressViewModel } from "@/lib/progress-view-model";
import { CLAIM_PROGRESS } from "@/registry/progress-view-model/examples/claim-appeal.example-adapter";
import { INVOICE_PROGRESS } from "@/registry/progress-view-model/examples/invoice.example-adapter";
import { STRESS_PROGRESS } from "@/registry/progress-view-model/examples/stress.example-adapter";

export const EXAMPLES: OccupantExamples<ProgressViewModel> = {
  primary: INVOICE_PROGRESS,
  secondary: CLAIM_PROGRESS,
  stress: STRESS_PROGRESS,
};
