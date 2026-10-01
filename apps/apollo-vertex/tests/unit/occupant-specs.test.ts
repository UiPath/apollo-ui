import { describe, expect, it } from "vitest";
import { fitsSurface, occupantOrientations } from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";

// Every registered occupant, checked by its spec alone.
describe.each(OCCUPANT_SPECS.map((o) => [o.spec.name, o] as const))("%s", (_, {
  spec,
  examples,
}) => {
  it("has a label and a whole-number minWidth", () => {
    expect(spec.label.trim()).not.toBe("");
    expect(
      Number.isInteger(spec.requires.minWidth) && spec.requires.minWidth > 0,
    ).toBe(true);
  });

  it("has an example for each role: primary, secondary, and stress", () => {
    expect(examples.toSorted()).toEqual(["primary", "secondary", "stress"]);
  });

  it("fits exactly the surfaces whose orientation it claims", () => {
    const orientations = occupantOrientations(spec);
    for (const surface of SURFACE_SPECS) {
      const claimed =
        orientations.includes(surface.provides.orientation) &&
        (!spec.surfaces || spec.surfaces.includes(surface.name));
      const result = fitsSurface(surface, spec);
      // A scroll mismatch can rule a claimed surface out; it must say so.
      if (claimed && !result.fits)
        expect(result.reasons.join(" ")).toMatch(/scrolling/);
      if (!claimed) expect(result.fits).toBe(false);
    }
    expect(
      SURFACE_SPECS.some((surface) => fitsSurface(surface, spec).fits),
    ).toBe(true);
  });
});
