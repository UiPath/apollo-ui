import {
  endPanelMaxWidth,
  END_PANEL_DEFAULT_PX,
  START_PANEL_PX,
} from "@/templates/detail-page/detail-page.template";
import { PADDED_INSET_PX } from "@/lib/composition";
import { expect, openPreview, test } from "./fixtures";

type Placement = "below-header" | "beside-header";
interface Combo {
  shell: "sidebar" | "minimal";
  panels: "none" | "start" | "end" | "both";
  start: { placement: Placement; open: boolean };
  end: { placement: Placement; open: boolean };
}

const query = ({ shell, panels, start, end }: Combo) => {
  const params = new URLSearchParams();
  if (shell === "minimal") params.set("shell", "minimal");
  if (panels !== "both") params.set("panels", panels);
  if (start.placement === "beside-header") params.set("start", start.placement);
  if (end.placement === "beside-header") params.set("end", end.placement);
  if (!start.open) params.set("start-state", "closed");
  if (!end.open) params.set("end-state", "closed");
  const q = params.toString();
  return q ? `?${q}` : "";
};

const label = (c: Combo) =>
  `${c.shell}, ${c.panels}, start ${c.start.placement} ${c.start.open ? "open" : "closed"}, end ${c.end.placement} ${c.end.open ? "open" : "closed"}`;

const open = (placement: Placement = "below-header") => ({
  placement,
  open: true,
});
const closed = (placement: Placement = "below-header") => ({
  placement,
  open: false,
});

/** A spread of combinations for every PR. The full matrix is @full. */
const CORE: Combo[] = (["sidebar", "minimal"] as const).flatMap((shell) => [
  { shell, panels: "both", start: open(), end: open() },
  { shell, panels: "both", start: open("beside-header"), end: open() },
  { shell, panels: "both", start: open(), end: open("beside-header") },
  {
    shell,
    panels: "both",
    start: open("beside-header"),
    end: open("beside-header"),
  },
  { shell, panels: "both", start: closed(), end: open() },
  { shell, panels: "both", start: open("beside-header"), end: closed() },
  { shell, panels: "none", start: open(), end: open() },
  { shell, panels: "start", start: open("beside-header"), end: open() },
  { shell, panels: "end", start: open(), end: open("beside-header") },
]);

const PLACEMENTS: Placement[] = ["below-header", "beside-header"];
const FULL: Combo[] = (["sidebar", "minimal"] as const).flatMap((shell) =>
  (["none", "start", "end", "both"] as const).flatMap((panels) =>
    PLACEMENTS.flatMap((sp) =>
      PLACEMENTS.flatMap((ep) =>
        [true, false].flatMap((so) =>
          [true, false].map((eo) => ({
            shell,
            panels,
            start: { placement: sp, open: so },
            end: { placement: ep, open: eo },
          })),
        ),
      ),
    ),
  ),
);

async function checkLayout(
  page: import("@playwright/test").Page,
  combo: Combo,
) {
  await openPreview(page, query(combo));
  const g = await page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        x: r.left,
        right: r.right,
        y: r.top,
        bottom: r.bottom,
        w: r.width,
        visibility: style.visibility,
        inert: el.inert,
        shadow: getComputedStyle(el, "::after").boxShadow,
        borders: [
          style.borderLeftWidth,
          style.borderRightWidth,
          style.borderBottomWidth,
        ].join(","),
      };
    };
    const state = (side: string) =>
      document.querySelector<HTMLElement>(
        `[data-surface=side-panel][data-side=${side}]`,
      )?.dataset.state;
    return {
      template: read("[data-template]"),
      header: read("[data-slot=detail-page-header]"),
      start: read("[data-slot=detail-page-start-panel]"),
      main: read("[data-slot=detail-page-main]"),
      end: read("[data-slot=detail-page-end-panel]"),
      startState: state("start"),
      endState: state("end"),
      startInner: document
        .querySelector(
          "[data-surface=side-panel][data-side=start] [data-occupant]",
        )
        ?.getBoundingClientRect().width,
    };
  });
  const enabled = {
    start: combo.panels === "start" || combo.panels === "both",
    end: combo.panels === "end" || combo.panels === "both",
  };
  // The rule may close a panel at this width; these combos all fit at 1440.
  const startOpen = enabled.start && combo.start.open;
  const endOpen = enabled.end && combo.end.open;
  const t = g.template!;
  const endWidth = Math.min(
    END_PANEL_DEFAULT_PX,
    endPanelMaxWidth(t.w, startOpen),
  );
  const near = (a: number, b: number) =>
    expect(Math.abs(a - b)).toBeLessThan(1.5);

  for (const side of ["start", "end"] as const) {
    const slot = g[side];
    if (!enabled[side]) {
      expect(slot, `${side} slot absent`).toBeNull();
      continue;
    }
    const isOpen = side === "start" ? startOpen : endOpen;
    expect(g[`${side}State`]).toBe(isOpen ? "open" : "closed");
    if (isOpen) {
      expect(slot!.visibility).toBe("visible");
      expect(slot!.inert).toBe(false);
    } else {
      // Closed panels take no space: 0 wide, invisible, inert.
      expect([slot!.w, slot!.visibility, slot!.inert]).toEqual([
        0,
        "hidden",
        true,
      ]);
    }
  }

  // Panels are exactly their width; dividers are overlays. Main fills the rest.
  near(
    g.main!.w,
    t.w - (startOpen ? START_PANEL_PX : 0) - (endOpen ? endWidth : 0),
  );
  if (startOpen) {
    near(g.start!.w, START_PANEL_PX);
    near(g.startInner!, START_PANEL_PX - 2 * PADDED_INSET_PX);
    expect(g.start!.borders).toBe("0px,0px,0px");
    expect(g.start!.shadow).toMatch(/ -1px 0px 0px 0px inset$/);
  }
  if (endOpen) {
    near(g.end!.w, endWidth);
    expect(g.end!.shadow).toMatch(/ 1px 0px 0px 0px inset$/);
  }
  expect(g.header!.shadow).toContain(" 0px -1px 0px 0px");

  // Placement: beside-header panels run full height and move the header over.
  const startBeside = startOpen && combo.start.placement === "beside-header";
  const endBeside = endOpen && combo.end.placement === "beside-header";
  near(g.header!.x, t.x + (startBeside ? START_PANEL_PX : 0));
  near(g.header!.right, t.right - (endBeside ? endWidth : 0));
  if (startOpen) near(g.start!.y, startBeside ? t.y : g.header!.bottom);
  if (endOpen) near(g.end!.y, endBeside ? t.y : g.header!.bottom);
  if (startOpen) near(g.start!.bottom, t.bottom);
  // In the minimal shell the template sits under the Shell's top bar.
  if (combo.shell === "minimal") expect(t.y).toBeGreaterThan(50);
}

test.describe("layout", () => {
  for (const combo of CORE) {
    test(label(combo), async ({ page }) => {
      await checkLayout(page, combo);
    });
  }
  for (const combo of FULL) {
    test(`${label(combo)} @full`, async ({ page }) => {
      await checkLayout(page, combo);
    });
  }
});
