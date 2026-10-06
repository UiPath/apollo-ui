import { describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { resolveLayout } from "@/lib/layout";

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
    // The map is the template's declared layout, as previews start it.
    const placed = resolveLayout(host.spec).regions.map(
      (region) => region.slot,
    );
    for (const slot of host.spec.slots) {
      expect(host.slotLabels[slot.name]?.trim(), slot.name).toBeTruthy();
      expect(placed, slot.name).toContain(slot.name);
    }
  });

  it("declares layout areas and choices only for its own slots", () => {
    const slots = host.spec.slots.map((slot) => slot.name);
    const { areas, options = {} } = host.spec.layout;
    for (const slot of [...Object.keys(areas), ...Object.keys(options)])
      expect(slots).toContain(slot);
  });
});
