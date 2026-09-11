export const CATALOG_PHASES = ["Details", "Choose", "Review", "Done"] as const;
export const NON_CATALOG_PHASES = ["Details", "Sent"] as const;

// J3 intake, now carrying its own terminal phase, the same one line
// extension the comment above used to anticipate.
export const J3_INTAKE_PHASES = [
  "Details",
  "Vendor",
  "Data & Info",
  "General Info",
  "Review",
  "Done",
] as const;
