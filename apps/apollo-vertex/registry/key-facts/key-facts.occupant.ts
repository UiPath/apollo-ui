import { Info } from "lucide-react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The key facts spec. It describes the space it needs from a
 * surface, never a template.
 */
export const keyFactsOccupant = {
  name: "key-facts",
  label: "Key facts",
  icon: Info,
  orientations: ["vertical", "horizontal"],
  // Measured floor: 128px in a horizontal surface (8rem columns), less in a
  // vertical one. Declared above it so a value's words don't wrap one per line.
  requires: { minWidth: 160, padding: "padded", scroll: "either" },
} as const satisfies OccupantSpec;
