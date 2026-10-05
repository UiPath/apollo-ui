import { describe, expect, it } from "vitest";
import {
  fits,
  type LocaleKey,
  type OccupantSpec,
  occupantSizing,
  PADDED_INSET_PX,
} from "@/lib/composition";
import {
  normalizePanel,
  type OccupantRef,
  occupantTitle,
  PANEL_MAX_TABS,
  type PanelSpec,
  panelMinWidth,
  resolvePanel,
  type TabSpec,
  validatePanel,
} from "@/lib/panel";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";

// Made-up keys for made-up occupants; real specs are checked against en.json.
const key = (name: string) => name as LocaleKey;

const end = detailPageTemplate.slots.find((s) => s.name === "end-panel");
if (!end) throw new Error("No end-panel slot");

const spec = (
  name: string,
  extra: Partial<OccupantSpec> = {},
  minWidth = 200,
): OccupantSpec => ({
  name,
  label: name.toUpperCase(),
  titleKey: key(`${name}_title`),
  requires: { minWidth, scroll: "either" },
  ...extra,
});
// No titleKey, so nothing to fall back to but the slug, which is never used.
const UNTITLED: OccupantSpec = {
  name: "untitled",
  label: "UNTITLED",
  requires: { minWidth: 200, scroll: "either" },
};
const SPECS = [
  spec("alpha"),
  spec("beta"),
  spec("gamma"),
  UNTITLED,
  spec("viewer", { sizing: "fill" }),
  spec("wide", {}, 400),
];
const panel = (...tabs: TabSpec[]): PanelSpec => ({
  surface: "side-panel",
  tabs,
});
type LooseRef = string | { occupant: string; title?: string };
const ref = (r: LooseRef): OccupantRef =>
  typeof r === "string"
    ? r
    : { occupant: r.occupant, ...(r.title && { title: key(r.title) }) };
const tab = (id: string, occupants: LooseRef[], label?: string): TabSpec => ({
  id,
  occupants: occupants.map((r) => ref(r)),
  ...(label && { label: key(label) }),
});

describe("normalizePanel", () => {
  it("turns one occupant into one tab named after it", () => {
    expect(normalizePanel("alpha")).toEqual(panel(tab("alpha", ["alpha"])));
  });

  it("keeps a ref's title", () => {
    const titled = { occupant: "alpha", title: "here_title" };
    expect(normalizePanel(ref(titled))).toEqual(panel(tab("alpha", [titled])));
  });

  it("passes a whole panel through", () => {
    const whole = panel(tab("a", ["alpha"]), tab("b", ["beta"]));
    expect(normalizePanel(whole)).toBe(whole);
  });

  it("gives a valid panel for a single occupant", () => {
    expect(validatePanel(normalizePanel("alpha"), SPECS)).toEqual([]);
  });
});

describe("validatePanel", () => {
  it("accepts tabs and a labeled stack", () => {
    const valid = panel(
      tab("one", ["alpha"]),
      tab("two", ["beta", "gamma"], "two_label"),
      tab("doc", ["viewer"]),
    );
    expect(validatePanel(valid, SPECS)).toEqual([]);
  });

  it(`allows at most ${PANEL_MAX_TABS} tabs`, () => {
    const names = ["alpha", "beta", "gamma", "viewer", "wide", "untitled"];
    const six = panel(...names.map((n) => tab(n, [n], `${n}_label`)));
    expect(validatePanel(six, SPECS)).toEqual([
      `A panel has at most ${PANEL_MAX_TABS} tabs; this one has 6.`,
    ]);
  });

  it("needs unique tab ids", () => {
    const twice = panel(tab("a", ["alpha"]), tab("a", ["beta"]));
    expect(validatePanel(twice, SPECS)).toContain('Tab id "a" is used twice.');
  });

  it("needs a label on a tab with more than one occupant", () => {
    const unlabeled = panel(tab("stack", ["alpha", "beta"]));
    expect(validatePanel(unlabeled, SPECS)).toEqual([
      'Tab "stack" stacks 2 occupants, so it needs a label.',
    ]);
  });

  it("keeps a fill occupant alone in its tab", () => {
    const shared = panel(tab("docs", ["viewer", "alpha"], "docs_label"));
    expect(validatePanel(shared, SPECS)).toEqual([
      'The viewer occupant fills its tab, so it can\'t share tab "docs".',
    ]);
  });

  it("allows an occupant at most once per panel", () => {
    const repeated = panel(tab("a", ["alpha"]), tab("b", ["alpha"]));
    expect(validatePanel(repeated, SPECS)).toEqual([
      "The alpha occupant appears more than once.",
    ]);
  });

  it("names an unknown occupant", () => {
    expect(validatePanel(panel(tab("a", ["nope"])), SPECS)).toContain(
      'Tab "a" names an unknown occupant, "nope".',
    );
  });

  it("needs a title for each stacked occupant's heading", () => {
    const stack = panel(tab("s", ["alpha", "untitled"], "s_label"));
    expect(validatePanel(stack, SPECS)).toEqual([
      'The untitled occupant in tab "s" needs a title for its heading.',
    ]);
  });

  it("needs a label for every tab when there are several", () => {
    const tabs = panel(tab("a", ["alpha"]), tab("u", ["untitled"]));
    expect(validatePanel(tabs, SPECS)).toEqual([
      'Tab "u" needs a label, or an occupant with a title.',
    ]);
  });
});

describe("titles", () => {
  const alpha = spec("alpha");

  it("uses the ref's title first", () => {
    expect(
      occupantTitle(ref({ occupant: "alpha", title: "mine" }), alpha),
    ).toBe("mine");
  });

  it("falls back to the spec's titleKey", () => {
    expect(occupantTitle("alpha", alpha)).toBe("alpha_title");
    expect(occupantTitle({ occupant: "alpha" }, alpha)).toBe("alpha_title");
  });

  it("never falls back to the slug or the English label", () => {
    expect(occupantTitle("untitled", UNTITLED)).toBeUndefined();
  });

  it("labels a single-occupant tab with its occupant's title", () => {
    const [only] = resolvePanel(panel(tab("a", ["alpha"])), SPECS).tabs;
    expect(only?.label).toBe("alpha_title");
  });

  it("prefers the tab's own label", () => {
    const [only] = resolvePanel(
      panel(tab("a", ["alpha"], "a_label")),
      SPECS,
    ).tabs;
    expect(only?.label).toBe("a_label");
  });
});

describe("sizing", () => {
  it("defaults to flow", () => {
    expect(occupantSizing(spec("plain"))).toBe("flow");
    expect(occupantSizing(spec("doc", { sizing: "fill" }))).toBe("fill");
  });
});

describe("fits() for a panel", () => {
  it("fits when every occupant in every tab fits", () => {
    const resolved = resolvePanel(
      panel(tab("a", ["alpha"]), tab("b", ["beta", "gamma"], "b_label")),
      SPECS,
    );
    expect(fits(end, sidePanelSurface, resolved)).toEqual({
      fits: true,
      reasons: [],
    });
  });

  it("names each occupant that doesn't fit, by tab", () => {
    const resolved = resolvePanel(
      panel(tab("a", ["alpha"]), tab("b", ["wide"])),
      SPECS,
    );
    const result = fits(end, sidePanelSurface, resolved);
    expect(result.fits).toBe(false);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toMatch(/^wide \(tab "b"\): Needs 400px/);
  });
});

describe("panelMinWidth", () => {
  it("is the widest occupant across all tabs, with its inset", () => {
    const resolved = resolvePanel(
      panel(tab("a", ["alpha"]), tab("b", ["wide"])),
      SPECS,
    );
    expect(panelMinWidth(sidePanelSurface, resolved)).toBe(
      400 + 2 * PADDED_INSET_PX,
    );
  });

  it("never goes below the surface's own minimum", () => {
    const resolved = resolvePanel(panel(tab("a", ["alpha"])), SPECS);
    expect(panelMinWidth(sidePanelSurface, resolved)).toBe(
      Math.max(sidePanelSurface.width.min, 200 + 2 * PADDED_INSET_PX),
    );
  });
});
