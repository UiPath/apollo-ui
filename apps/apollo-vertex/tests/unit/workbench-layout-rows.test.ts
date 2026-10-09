import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { SlotLayoutSection } from "@/app/preview/occupants/slot-layout-section";
import type { SlotLayoutOptions, TemplateSpec } from "@/lib/composition";
import { TWO_UP_HOST, twoUpTemplate } from "./fixtures/two-up-template";

// The inspector's layout as picture choices, from a template's spec
// alone: only the options a slot declares, each a thumbnail of the page
// drawn from its layout, and a lock, with why, on a refused one.

/** The two-up template with the aside's options as given. */
const withAside = (aside: SlotLayoutOptions): TemplateHost => {
  const spec = {
    ...twoUpTemplate,
    layout: { ...twoUpTemplate.layout, options: { aside } },
  } as const satisfies TemplateSpec;
  return { ...TWO_UP_HOST, spec };
};
// An aside placement over the body as well: its layout refuses it.
const refusing = withAside({
  optional: true,
  closable: true,
  defaultPlacement: "beside",
  placements: { wide: { columns: ["body", "aside"], rows: ["page", "page"] } },
});

const render = (host: TemplateHost, layout = {}) =>
  renderToStaticMarkup(
    createElement(SlotLayoutSection, {
      host,
      slot: "aside",
      layout,
      onLayout: () => null,
      status: null,
    }),
  );
/** Each radio group's name, and its options' names, in order. */
const groups = (html: string) =>
  [...html.matchAll(/role="radiogroup"[^>]*aria-label="([^"]+)"/g)].map(
    (m) => m[1],
  );
const options = (html: string) =>
  [...html.matchAll(/role="radio"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);

describe("layout picture choices", () => {
  it("offer Open, Closed, and Hidden, and the placements, as radio groups", () => {
    const html = render(refusing);
    expect(groups(html)).toEqual([
      "workbench_layout_panel_of",
      "workbench_layout_placement_of",
    ]);
    expect(options(html)).toEqual([
      "workbench_layout_open",
      "workbench_layout_closed",
      "workbench_layout_hidden",
      "beside",
      "wide",
    ]);
  });

  it("draw each option as a thumbnail of the page, the aside highlighted", () => {
    const html = render(refusing);
    // Five options, and the refused one has no picture to draw.
    expect(html.match(/data-slot="workbench-map-thumbnail"/g)).toHaveLength(4);
    // Open: the aside there; Closed: a narrow strip; Hidden: no aside.
    const thumbs = [
      ...html.matchAll(
        /data-slot="workbench-map-thumbnail" style="grid-template-columns:([^;"]+)/g,
      ),
    ].map((m) => m[1]);
    expect(thumbs.slice(0, 3)).toEqual(["3fr 1fr", "3fr 4px", "3fr"]);
    expect(html).toMatch(/data-region="aside" data-highlighted="true"/);
  });

  it("offer only what the slot declares, and no row for one option", () => {
    const notClosable = render(withAside({ optional: true }));
    expect(options(notClosable)).toEqual([
      "workbench_layout_open",
      "workbench_layout_hidden",
    ]);
    const neither = render(
      withAside({
        defaultPlacement: "beside",
        placements: {
          below: { columns: ["body", "body"], rows: ["page", "page"] },
        },
      }),
    );
    expect(groups(neither)).toEqual(["workbench_layout_placement_of"]);
  });

  it("lock a refused option, with why, beside its card", () => {
    const html = render(refusing);
    const described = html.match(
      /aria-label="wide"[^>]*aria-describedby="([^"]+)"|aria-describedby="([^"]+)"[^>]*aria-label="wide"/,
    );
    const id = described?.[1] ?? described?.[2];
    expect(id).toBeTruthy();
    expect(html).toContain(
      `id="${id}" class="sr-only">workbench_layout_refused`,
    );
    expect(html).toContain('data-slot="workbench-lock"');
  });

  it("turn Placement off, dimmed, while the aside is hidden", () => {
    const html = render(refusing, { aside: { present: false } });
    expect(html.match(/data-dim="true"/g)).toHaveLength(1);
    expect(html).toMatch(
      /role="radiogroup"[^>]*aria-label="workbench_layout_placement_of"[^>]*data-disabled=""|data-disabled=""[^>]*aria-label="workbench_layout_placement_of"/,
    );
  });
});
