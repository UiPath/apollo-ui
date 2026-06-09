import { Selection } from "./v1/Selection";

/**
 * Catalog — Variant 2: same Selection screen as V1, but tiles show the vendor's
 * brand logo instead of a product photo.
 */
export function CatalogV2({ cold }: { cold?: boolean }) {
  return <Selection imageMode="logo" cold={cold} />;
}
