import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { PageMap } from "@/app/preview/occupants/page-map";
import { layoutMenu } from "@/app/preview/occupants/workbench-layout";
import {
  normalizeView,
  parseWorkbenchView,
  serializeWorkbenchView,
  slotFit,
  templateNames,
} from "@/app/preview/occupants/workbench-url-state";
import type { OccupantSpec } from "@/lib/composition";
import { resolveLayout } from "@/lib/layout";
import { TWO_UP_HOST, twoUpTemplate } from "./fixtures/two-up-template";

// The workbench with a second template, registered only here, and no
// workbench code of its own: everything it shows comes from the spec.

beforeAll(() => {
  TEMPLATE_HOSTS["two-up"] = TWO_UP_HOST;
});
afterAll(() => {
  delete TEMPLATE_HOSTS["two-up"];
});

const regions = (html: string) =>
  [...html.matchAll(/data-region="([^"]+)"([^>]*)>/g)].map(
    ([, region, rest = ""]) =>
      `${region}${rest.includes('data-state="closed"') ? ":closed" : ""}${
        rest.includes('data-highlighted="true"') ? "*" : ""
      }`,
  );

describe("a second template, from its spec alone", () => {
  it("is offered alongside the Detail page", () => {
    expect(templateNames()).toEqual(["detail-page", "two-up"]);
  });

  it("draws its own regions on the page map", () => {
    const map = (choices = {}) =>
      renderToStaticMarkup(
        createElement(PageMap, {
          layout: resolveLayout(twoUpTemplate, choices),
          highlighted: ["aside"],
          cue: "here",
          name: "aside",
        }),
      );
    expect(regions(map())).toEqual(["body", "aside*"]);
    expect(regions(map({ aside: { open: false } }))).toEqual([
      "body",
      "aside:closed*",
    ]);
    expect(regions(map({ aside: { present: false } }))).toEqual(["body"]);
  });

  it("offers only the choices it declares in its slots' layout", () => {
    expect(layoutMenu(twoUpTemplate, {})).toEqual([
      {
        slot: "aside",
        present: [
          { value: true, lock: null },
          { value: false, lock: null },
        ],
        open: [
          { value: true, lock: null },
          { value: false, lock: null },
        ],
      },
    ]);
  });

  it("round-trips its layout through a link", () => {
    for (const query of [
      "?view=template&template=two-up&aside-present=false",
      "?view=template&template=two-up&aside-state=closed",
    ])
      expect(serializeWorkbenchView(parseWorkbenchView(query))).toBe(query);
    // Detail page params mean nothing to it.
    const view = parseWorkbenchView(
      "?occupant=key-facts&view=template&template=two-up&slot=body&end-panel-state=closed&panels=none",
    );
    expect(view.layout).toEqual({});
  });

  it("rejects an occupant in a slot that doesn't take its surface", () => {
    const mainOnly: OccupantSpec = {
      name: "main-only",
      label: "Main only",
      titleKey: "detail_page_preview_placeholder",
      surfaces: ["content-area"],
      requires: { minWidth: 0, scroll: "either" },
    };
    expect(slotFit(TWO_UP_HOST, "body", mainOnly).fits).toBe(true);
    const aside = slotFit(TWO_UP_HOST, "aside", mainOnly);
    expect(aside.fits).toBe(false);
    expect(aside.reasons).toContain(
      "Works only in content-area; this slot holds side-panel.",
    );
  });

  it("opens an older link with its occupant's slot there and open, once", () => {
    const view = parseWorkbenchView(
      "?occupant=queue&view=template&template=two-up&slot=aside&aside-present=false&aside-state=closed",
    );
    expect(view.layout).toEqual({ aside: { present: true, open: true } });
    expect(view.contents.aside?.tabs).toEqual([
      { id: "queue", occupants: ["queue"] },
    ]);
    expect(normalizeView(view)).toEqual(view);
    // After that, no slot is focused: the aside can be left out or closed.
    const [aside] = layoutMenu(twoUpTemplate, view.layout);
    expect(aside?.present?.every((o) => o.lock === null)).toBe(true);
    expect(aside?.open?.every((o) => o.lock === null)).toBe(true);
  });
});
