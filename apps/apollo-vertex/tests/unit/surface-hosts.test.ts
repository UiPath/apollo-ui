import { describe, expect, it } from "vitest";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";

// Registering a surface is its spec, a label, and a host: previews and the
// occupant workbench render it from these, with no template.
describe.each(SURFACE_SPECS.map((s) => [s.name] as const))("%s", (name) => {
  it("has a host that renders it on its own", () => {
    expect(SURFACE_HOSTS[name]).toBeTypeOf("function");
  });

  it("has a label", () => {
    expect(surfaceLabel(name)).not.toBe(name);
  });
});
