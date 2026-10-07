import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { SlotLayoutSection } from "@/app/preview/occupants/slot-layout-section";
import type { TemplateSpec } from "@/lib/composition";
import { TWO_UP_HOST, twoUpTemplate } from "./fixtures/two-up-template";

// The inspector's layout rows, from a template's spec alone: switches for
// what it declares, and a lock, with why, in place of a refused option.

/** The two-up template, with an aside placement its layout refuses. */
const refusing = {
  ...twoUpTemplate,
  layout: {
    ...twoUpTemplate.layout,
    options: {
      aside: {
        optional: true,
        closable: true,
        defaultPlacement: "beside",
        // Over the body as well: it would leave the body nothing.
        placements: {
          wide: { columns: ["body", "aside"], rows: ["page", "page"] },
        },
      },
    },
  },
} as const satisfies TemplateSpec;
const host: TemplateHost = { ...TWO_UP_HOST, spec: refusing };

const render = (layout = {}) =>
  renderToStaticMarkup(
    createElement(SlotLayoutSection, {
      host,
      slot: "aside",
      layout,
      onLayout: () => null,
      status: null,
    }),
  );

describe("layout rows", () => {
  it("are switches for showing and opening, named for the slot", () => {
    const html = render();
    const switches = [
      ...html.matchAll(/role="switch"[^>]*aria-label="([^"]+)"/g),
    ];
    expect(switches.map((m) => m[1])).toEqual([
      "workbench_layout_show_of",
      "workbench_layout_open_of",
    ]);
  });

  it("puts a lock, with why, in place of a refused option's control", () => {
    const html = render();
    expect(html).toContain('data-slot="workbench-lock"');
    // The reason describes the lock, and is there for its tooltip.
    const described =
      html.match(
        /data-slot="workbench-lock"[^>]*aria-describedby="([^"]+)"/,
      )?.[1] ??
      html.match(
        /aria-describedby="([^"]+)"[^>]*data-slot="workbench-lock"/,
      )?.[1];
    expect(described).toBeTruthy();
    expect(html).toContain(
      `id="${described}" class="sr-only">workbench_layout_refused`,
    );
    // No placement control to pick from.
    expect(html).not.toContain("workbench_layout_placement_of");
  });

  it("dims and turns off Open and Placement while the slot is left out", () => {
    const html = render({ aside: { present: false } });
    expect(html.match(/data-dim="true"/g)).toHaveLength(2);
    expect(html).toMatch(
      /aria-label="workbench_layout_open_of"[^>]*disabled=""|disabled=""[^>]*aria-label="workbench_layout_open_of"/,
    );
  });
});
