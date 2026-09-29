/** Display names for the registered surfaces, for docs and tooling. */
const SURFACE_LABELS: Record<string, string> = {
  "page-header": "Page header",
  "side-panel": "Side panel",
  "content-area": "Content area",
};

export const surfaceLabel = (name: string) => SURFACE_LABELS[name] ?? name;
