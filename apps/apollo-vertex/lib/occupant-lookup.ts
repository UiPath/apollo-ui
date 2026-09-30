import { OCCUPANT_SPECS } from "@/lib/occupants.generated";

/** A registered occupant's spec, by name. */
export const specFor = (name: string) =>
  OCCUPANT_SPECS.find((o) => o.spec.name === name)?.spec;
