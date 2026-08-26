/**
 * The marginalia gutter. One column runs the length of the case detail holding
 * the sender avatar and the activity-log actor marks, so every text block
 * starts at the same left edge instead of stacking centred blocks.
 *
 * 44px: originally sized for the confidence ring, which the ConfidenceSignal
 * chip replaced. It now holds a 28px avatar and 24px actor marks. Both centre
 * independently, so they stay aligned with each other whatever this is set to.
 */
export const GUTTER_ROW = "flex gap-[18px]";
export const GUTTER = "w-11 shrink-0";
