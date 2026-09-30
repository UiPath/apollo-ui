import { describe, expect, it } from "vitest";
import { MAP_REGIONS } from "@/app/_components/surface-hosts";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";

// Registering a template for previews is its host: the workbench's template
// view and picker render it from this, with no change to the page.
describe.each(Object.entries(TEMPLATE_HOSTS))("%s", (name, host) => {
  it("is the template its spec names, with a label and a frame", () => {
    expect(host.spec.name).toBe(name);
    expect(host.label.trim()).not.toBe("");
    expect(host.Frame).toBeTypeOf("function");
    expect(host.minWidth).toBeGreaterThan(0);
  });

  it("labels every slot and places it on the page map", () => {
    for (const slot of host.spec.slots) {
      expect(host.slotLabels[slot.name]?.trim(), slot.name).toBeTruthy();
      const regions = host.regions[slot.name] ?? [];
      expect(regions.length, slot.name).toBeGreaterThan(0);
      for (const region of regions) expect(MAP_REGIONS).toContain(region);
    }
  });

  it("only offers placement for its own slots", () => {
    const slots = host.spec.slots.map((slot) => slot.name);
    for (const slot of host.placeable) expect(slots).toContain(slot);
  });
});
