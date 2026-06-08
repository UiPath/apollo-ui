import { CATALOG_VARIANTS } from "./variants";

/**
 * Catalog page host. Renders the default variant. The variant registry (and the
 * in-app switcher) is kept for future use — the switcher is just not shown now.
 */
export function Catalog() {
  const ActiveVariant = CATALOG_VARIANTS[0].Component;
  return (
    <div className="relative h-full">
      <ActiveVariant />
    </div>
  );
}
