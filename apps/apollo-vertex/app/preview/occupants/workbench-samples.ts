import { createContext, useContext } from "react";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import { occupantsIn, type SlotContents } from "./workbench-compose";

/*
 * The template view's samples: which of its examples each occupant on the
 * page shows, primary unless chosen otherwise in the inspector. The link
 * carries the others, as samples=activity-timeline:secondary~key-facts:stress.
 */

/** Each occupant's sample, where it isn't primary. */
export type Samples = Readonly<Record<string, ExampleRole>>;

const PARAM = "samples";

/** The samples a link names, by occupant; anything unknown is left out. */
export function parseSamples(params: URLSearchParams): Samples {
  const pairs = (params.get(PARAM) ?? "").split("~").flatMap((pair) => {
    const [occupant, role] = pair.split(":");
    const known = EXAMPLE_ROLES.find((r) => r === role);
    return occupant && known && known !== "primary"
      ? [[occupant, known] as const]
      : [];
  });
  return Object.fromEntries(pairs);
}

/** The samples into a link, in a steady order; none when all are primary. */
export function writeSamples(samples: Samples, params: URLSearchParams) {
  const pairs = Object.entries(samples)
    .filter(([, role]) => role !== "primary")
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([occupant, role]) => `${occupant}:${role}`);
  if (pairs.length > 0) params.set(PARAM, pairs.join("~"));
}

/** The samples of occupants still on the page, primary ones dropped. */
export function normalizeSamples(
  contents: SlotContents,
  samples: Samples,
): Samples {
  const onPage = new Set(
    Object.values(contents).flatMap((panel) => occupantsIn(panel)),
  );
  return Object.fromEntries(
    Object.entries(samples).filter(
      ([occupant, role]) => role !== "primary" && onPage.has(occupant),
    ),
  );
}

/** The samples, for the stage and the inspector's cards, and changing them. */
interface SamplesContextValue {
  samples: Samples;
  onSamples: (samples: Samples) => void;
}

export const SamplesContext = createContext<SamplesContextValue | null>(null);

/** An occupant's sample on the page, and choosing another. */
export function useSample(occupant: string) {
  const context = useContext(SamplesContext);
  return {
    sample: context?.samples[occupant] ?? ("primary" as const),
    onSample: (role: ExampleRole) =>
      context?.onSamples({ ...context.samples, [occupant]: role }),
  };
}
