export type DrilldownTab =
  | "overview"
  | "trend"
  | "categories"
  | "products"
  | "actions";

export const drilldownTabs: { key: DrilldownTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "categories", label: "Categories" },
  { key: "products", label: "Products" },
  { key: "actions", label: "Actions" },
];
