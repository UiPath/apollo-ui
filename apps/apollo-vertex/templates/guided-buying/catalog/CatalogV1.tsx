import { Selection } from "./v1/Selection";

/**
 * Catalog — Variant 1: the Guided Buying "Selection" screen (catalog goods),
 * product photos. `cold` switches between scoped (request) and cold browse.
 */
export function CatalogV1({ cold }: { cold?: boolean }) {
  return <Selection cold={cold} />;
}
