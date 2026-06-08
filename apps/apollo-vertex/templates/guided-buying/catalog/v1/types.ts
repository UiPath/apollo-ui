/** Product category — drives the placeholder icon and keyword imagery. */
export type CatalogCategory =
  | "Laptops"
  | "Monitors"
  | "Docking"
  | "Accessories";

/** A single catalog good available for selection. */
export interface CatalogItem {
  id: string;
  name: string;
  vendor: string;
  category: CatalogCategory;
  /** Procurement tier shown as a chip, e.g. "Standard". */
  tier: string;
  /** Fulfillment source / reseller shown as a chip, e.g. "CDW Netherlands". */
  source: string;
  /** Standard list price. */
  listPrice: number;
  /** Negotiated / EPP price when applicable. Undefined = no special pricing. */
  eppPrice?: number;
  currency: string;
  /** 1–3 key specs surfaced on the tile. */
  specs: string[];
  inStock: boolean;
  /** Remote product image URL; falls back to a category icon on error. */
  image?: string;
  /** Full, grouped spec breakdown for the detail view (flat specs used if absent). */
  specGroups?: SpecGroup[];
}

/** One labelled value within a spec group. */
export interface SpecRow {
  label: string;
  value: string;
}

/** A named group of spec rows (e.g. Display, Performance). */
export interface SpecGroup {
  label: string;
  rows: SpecRow[];
}

/**
 * The restated request that seeds the Selection screen. In production this is
 * produced by the Intake step; here it is stubbed (see SAMPLE_REQUEST) and
 * passed into <Selection /> via the `request` prop — the seam for real intake.
 */
export interface BuyRequest {
  /** Restated request. */
  summary: string;
  /** One quiet, auditable agent line. */
  agentNote: string;
}

/** How the catalog grid is ordered. */
export type SortKey = "recommended" | "price-asc" | "price-desc" | "name";

/** How results are laid out: scannable rows or product cards. */
export type LayoutMode = "rows" | "cards";

/** Which price is "active": negotiated EPP, or standard list. */
export type PriceBasis = "epp" | "list";

/** A one-line note appended to the Autopilot rail thread. */
export interface RailNote {
  id: number;
  text: string;
}

/** Active catalog constraints. Stock + priceBasis are the agent's inferences. */
export interface Filters {
  brands: string[];
  categories: CatalogCategory[];
  priceMin: number;
  priceMax: number;
  inStockOnly: boolean;
  priceBasis: PriceBasis;
}
