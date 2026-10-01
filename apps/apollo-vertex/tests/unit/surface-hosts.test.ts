import { describe, expect, it } from "vitest";
import { MAP_REGIONS, SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";

// Registering a surface is its spec, a label, and a host: previews and the
// occupant workbench render it from these, with no template, and place it
// on the workbench's page map.
describe.each(SURFACE_SPECS.map((s) => [s.name] as const))("%s", (name) => {
  it("has a host that renders it on its own", () => {
    expect(SURFACE_HOSTS[name]?.Host).toBeTypeOf("function");
  });

  it("says where its padding is, for measuring overflow", () => {
    expect(SURFACE_HOSTS[name]?.inner).toMatch(/^\[data-slot=[a-z-]+\]$/);
  });

  it("has a place on the page map", () => {
    const regions = SURFACE_HOSTS[name]?.regions ?? [];
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) expect(MAP_REGIONS).toContain(region);
  });

  it("has a label", () => {
    expect(surfaceLabel(name)).not.toBe(name);
  });
});
