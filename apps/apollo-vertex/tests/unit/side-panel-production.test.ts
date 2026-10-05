import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidePanel, type SidePanelOccupants } from "@/components/ui/side-panel";
import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import type { PanelSpec } from "@/lib/panel";

// The side panel with a broken panel config: it throws in development and
// tests, and in production logs every error and renders what's valid.

const key = (name: string) => name as LocaleKey;
const spec = (
  name: string,
  extra: Partial<OccupantSpec> = {},
): OccupantSpec => ({
  name,
  label: name,
  titleKey: key(`${name}_title`),
  requires: { minWidth: 0, scroll: "either" },
  ...extra,
});
const entry = (s: OccupantSpec) => ({
  spec: s,
  node: createElement("div", { "data-occupant": s.name }, s.name),
});

const BROKEN: PanelSpec = {
  surface: "side-panel",
  tabs: [
    { id: "good", occupants: ["alpha"] },
    // A fill occupant stacked with another, and a reference with no entry.
    {
      id: "stacked",
      label: key("stacked_label"),
      occupants: ["viewer", "beta"],
    },
    { id: "missing", occupants: ["nope"] },
  ],
};
const OCCUPANTS: SidePanelOccupants = {
  alpha: entry(spec("alpha")),
  beta: entry(spec("beta")),
  viewer: entry(spec("viewer", { sizing: "fill" })),
  // Named by no tab.
  extra: entry(spec("extra")),
};

const render = () =>
  renderToStaticMarkup(
    createElement(SidePanel, {
      side: "end",
      "aria-label": "Panel",
      panel: BROKEN,
      occupants: OCCUPANTS,
    }),
  );

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("a side panel with a broken config", () => {
  it("throws outside production, naming every broken rule", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(render).toThrow(/^SidePanel: /);
    expect(render).toThrow(/nope occupant, but it has no entry/);
    expect(render).toThrow(/extra entry isn't named/);
    expect(render).toThrow(/viewer occupant fills its tab/);
  });

  it("in production, logs every error and renders only what's valid", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = vi.spyOn(console, "error").mockReturnValue();
    const html = render();

    expect(error).toHaveBeenCalledTimes(1);
    const [message, errors] = error.mock.calls[0] ?? [];
    expect(message).toMatch(/^SidePanel: \d+ broken panel rules/);
    expect(errors).toEqual(
      expect.arrayContaining([
        "The panel names the nope occupant, but it has no entry.",
        "The extra entry isn't named by any tab in the panel.",
        'The viewer occupant fills its tab, so it can\'t share tab "stacked".',
      ]),
    );

    // The good tab, and the stack without its fill occupant.
    expect(html).toContain('data-tab="good"');
    expect(html).toContain('data-tab="stacked"');
    expect(html).not.toContain('data-tab="missing"');
    expect(html).toContain('data-occupant="alpha"');
    expect(html).toContain('data-occupant="beta"');
    expect(html).not.toContain('data-occupant="viewer"');
    expect(html).not.toContain('data-occupant="extra"');
  });
});
