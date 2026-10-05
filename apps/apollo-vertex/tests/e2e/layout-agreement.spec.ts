import { type LayoutChoices, resolveLayout } from "@/lib/layout";
import {
  DETAIL_PAGE_LAYOUT,
  DETAIL_PAGE_PANELS,
  type DetailPagePanels,
  detailPageTemplate,
  enabledPanels,
  type PanelPlacement,
  type PanelSide,
} from "@/templates/detail-page/detail-page.template";
import { expect, openPreview, test } from "./fixtures";

/*
 * DetailPage.tsx lays itself out with its own grid classes; its spec
 * declares the same layout as data (DETAIL_PAGE_LAYOUT), which previews
 * draw their page map from. For every layout a page can choose, the slots
 * DetailPage renders must sit exactly where resolveLayout() puts them.
 */

const PLACEMENTS: readonly PanelPlacement[] = ["below-header", "beside-header"];
const SIDES: readonly PanelSide[] = ["start", "end"];
const slotOf = (side: PanelSide) => `${side}-panel`;

interface Combo {
  panels: DetailPagePanels;
  placement: Record<PanelSide, PanelPlacement>;
  open: Record<PanelSide, boolean>;
}

// Every panels setting, with each present panel's placement and open state.
const COMBOS: Combo[] = DETAIL_PAGE_PANELS.flatMap((panels) => {
  const present = SIDES.filter((side) => enabledPanels(panels)[side]);
  let combos: Combo[] = [
    {
      panels,
      placement: { start: "below-header", end: "below-header" },
      open: { start: true, end: true },
    },
  ];
  for (const side of present) {
    combos = combos.flatMap((combo) =>
      PLACEMENTS.flatMap((placement) =>
        [true, false].map((open) => ({
          ...combo,
          placement: { ...combo.placement, [side]: placement },
          open: { ...combo.open, [side]: open },
        })),
      ),
    );
  }
  return combos;
});

const describeCombo = ({ panels, placement, open }: Combo) =>
  [
    `panels=${panels}`,
    ...SIDES.filter((side) => enabledPanels(panels)[side]).map(
      (side) => `${side} ${placement[side]}${open[side] ? "" : " closed"}`,
    ),
  ].join(", ");

const queryFor = ({ panels, placement, open }: Combo) => {
  const params = new URLSearchParams({ panels });
  for (const side of SIDES) {
    params.set(side, placement[side]);
    if (!open[side]) params.set(`${side}-state`, "closed");
  }
  return `?${params}`;
};

const choicesFor = ({ panels, placement, open }: Combo): LayoutChoices =>
  Object.fromEntries(
    SIDES.map((side) => [
      slotOf(side),
      {
        present: enabledPanels(panels)[side],
        open: open[side],
        placement: placement[side],
      },
    ]),
  );

const trackNames = (tracks: readonly { name: string }[]) =>
  tracks.map((track) => track.name);

for (const combo of COMBOS) {
  test(`DetailPage matches its declared layout: ${describeCombo(combo)}`, async ({
    page,
  }) => {
    // Wide enough that the main-width rule closes nothing.
    await openPreview(page, queryFor(combo), 1920);
    const rendered = await page.evaluate(
      ({ slots, columns, rows }) => {
        // A grid line pair to the first and last track it covers.
        const span = (start: string, end: string) => {
          const from = Number(start);
          const spans = /^span (\d+)$/.exec(end);
          const to = spans
            ? from + Number(spans[1]) - 1
            : end === "auto"
              ? from
              : Number(end) - 1;
          return [from - 1, to - 1];
        };
        return slots.flatMap((slot) => {
          const el = document.querySelector<HTMLElement>(
            `[data-slot=detail-page-${slot}]`,
          );
          if (!el) return [];
          const style = getComputedStyle(el);
          const [c0 = 0, c1 = 0] = span(
            style.gridColumnStart,
            style.gridColumnEnd,
          );
          const [r0 = 0, r1 = 0] = span(style.gridRowStart, style.gridRowEnd);
          return [
            {
              slot,
              columns: [columns[c0], columns[c1]],
              rows: [rows[r0], rows[r1]],
              open: el.dataset.state !== "closed",
            },
          ];
        });
      },
      {
        slots: detailPageTemplate.slots.map((slot) => slot.name),
        columns: trackNames(DETAIL_PAGE_LAYOUT.columns),
        rows: trackNames(DETAIL_PAGE_LAYOUT.rows),
      },
    );
    const declared = resolveLayout(
      detailPageTemplate,
      choicesFor(combo),
    ).regions.map(({ slot, columns, rows, open }) => ({
      slot,
      columns: [...columns],
      rows: [...rows],
      open,
    }));
    expect(rendered).toEqual(declared);
  });
}
