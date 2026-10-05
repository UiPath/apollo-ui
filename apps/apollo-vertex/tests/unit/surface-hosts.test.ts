import { describe, expect, it } from "vitest";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
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

  // The surface view's map is the default template: a slot there takes it.
  it("has a place on the page map", () => {
    const [defaultHost] = Object.values(TEMPLATE_HOSTS);
    const slots = defaultHost?.spec.slots ?? [];
    expect(slots.some((slot) => slot.surfaces.includes(name))).toBe(true);
  });

  it("has a label", () => {
    expect(surfaceLabel(name)).not.toBe(name);
  });
});
