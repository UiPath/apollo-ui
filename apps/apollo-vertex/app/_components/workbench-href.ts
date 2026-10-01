/** The workbench, opened with an occupant, and a surface, selected. */
export const workbenchHref = (occupant?: string, surface?: string) => {
  const params = new URLSearchParams();
  if (occupant) params.set("occupant", occupant);
  if (surface) params.set("surface", surface);
  const query = params.toString();
  return `/preview/occupants${query ? `?${query}` : ""}`;
};
