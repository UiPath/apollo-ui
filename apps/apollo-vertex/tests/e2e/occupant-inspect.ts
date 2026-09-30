import type { Page } from "@playwright/test";

/*
 * Shared by the occupant checks and measure:occupant: open an occupant in the
 * fixture, set its surface's width, and list every clip or overflow.
 */

// The element that holds each surface's padding: its inner area.
export const INNER: Record<string, string> = {
  "page-header": "[data-slot=page-header]",
  "side-panel": "[data-slot=side-panel-body]",
  "content-area": "[data-slot=content-area-body]",
};

export async function openFixture(page: Page, query: string) {
  await page.goto(`/preview/occupant?${query}`);
  await page
    .locator("[data-slot=occupant-fixture] [data-occupant]")
    .first()
    .waitFor();
  await page.waitForLoadState("networkidle");
}

/** Sets the fixture's width and lists every clip or overflow inside the surface. */
/**
 * settle: how long to wait after resizing. The checks wait 200ms; measuring
 * waits two animation frames (0).
 */
export const inspect = (
  page: Page,
  inner: string,
  width: number,
  settle = 200,
) =>
  page.evaluate(
    ([selector, boxWidth, wait]) => {
      const fixture = document.querySelector<HTMLElement>(
        "[data-slot=occupant-fixture]",
      )!;
      fixture.style.width = `${boxWidth}px`;
      return new Promise<{ occupantWidth: number; problems: string[] }>(
        (resolve) => {
          const measure = () => {
            const box = fixture.querySelector(selector)!;
            // Decorative layers (aria-hidden, absolute, no pointer events) may bleed
            // by design; take them out. Rulers stay: they're invisible.
            const decorative = [
              ...box.querySelectorAll<HTMLElement>("[aria-hidden=true]"),
            ].filter((el) => {
              const cs = getComputedStyle(el);
              return (
                cs.pointerEvents === "none" &&
                cs.position === "absolute" &&
                cs.visibility !== "hidden"
              );
            });
            const saved = decorative.map(
              (el) => [el, el.style.display] as const,
            );
            for (const el of decorative) el.style.display = "none";
            const style = getComputedStyle(box);
            const r = box.getBoundingClientRect();
            const bounds = {
              left: r.left + Number.parseFloat(style.paddingLeft),
              right: r.right - Number.parseFloat(style.paddingRight),
            };
            const describe = (el: Element) => {
              const slot = el instanceof HTMLElement ? el.dataset.slot : "";
              return `${el.tagName.toLowerCase()}${slot ? `[${slot}]` : ""} "${(el.textContent ?? "").trim().slice(0, 24)}"`;
            };
            const problems: string[] = [];
            for (const el of box.querySelectorAll("*")) {
              if (el instanceof SVGElement && !(el instanceof SVGSVGElement))
                continue;
              if (el.closest("[aria-hidden=true]")) continue;
              const cs = getComputedStyle(el);
              const er = el.getBoundingClientRect();
              if (
                cs.display === "none" ||
                cs.display === "contents" ||
                cs.visibility === "hidden"
              )
                continue;
              if (er.width === 0 || (er.width <= 1 && er.height <= 1)) continue;
              const scroller = el.closest("[data-scroll-x]");
              const inside = scroller !== null && scroller !== el;
              const isScroller =
                el instanceof HTMLElement && "scrollX" in el.dataset;
              if (
                !inside &&
                !isScroller &&
                el.scrollWidth > el.clientWidth + 1 &&
                el.clientWidth > 0
              ) {
                const truncated = cs.textOverflow === "ellipsis";
                // The full text must stay available: a title, or a tooltip.
                const fullText = el.closest(
                  "[title], [data-slot=tooltip-trigger]",
                );
                if (!(truncated && fullText)) {
                  problems.push(
                    `${truncated ? "truncated without a title" : "clipped"} ${describe(el)} (${el.scrollWidth} > ${el.clientWidth})`,
                  );
                }
              }
              if (
                !inside &&
                (er.right > bounds.right + 1 || er.left < bounds.left - 1)
              ) {
                problems.push(`outside ${describe(el)}`);
              }
            }
            for (const [el, display] of saved) el.style.display = display;
            resolve({
              occupantWidth: Math.round(bounds.right - bounds.left),
              problems: [...new Set(problems)],
            });
          };
          if (wait > 0) setTimeout(measure, wait);
          else requestAnimationFrame(() => requestAnimationFrame(measure));
        },
      );
    },
    [inner, width, settle] as const,
  );
