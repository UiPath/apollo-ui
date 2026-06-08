import type { ComponentType } from "react";
import { CatalogV1 } from "./CatalogV1";
import { CatalogV2 } from "./CatalogV2";

export interface CatalogVariant {
  /** Stable id used by the switcher and as the React key. */
  id: string;
  /** Human-readable label shown in the variant switcher. */
  label: string;
  /** The variant's root component. Rendered full-bleed inside the Catalog page. */
  Component: ComponentType;
}

/**
 * Registry of Catalog variants. Add a new variant by creating a component file
 * (e.g. CatalogV2.tsx) and appending one entry here — the in-app switcher picks
 * it up automatically.
 */
export const CATALOG_VARIANTS: CatalogVariant[] = [
  { id: "v1", label: "Product photos", Component: CatalogV1 },
  { id: "v2", label: "Brand logos", Component: CatalogV2 },
];
