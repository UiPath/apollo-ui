import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * Switching views, occupants, or samples keeps something on the stage in
 * every frame: the current view until the next is ready, never a blank
 * frame and never a spinner. Each occupant used to mount the Shell's
 * locale provider, whose loading gate showed a spinner for a few frames
 * on every remount.
 */

/** Samples the stage on every frame until stopped, from the next frame on. */
const watch = (page: Page) =>
  page.evaluate(() => {
    const seen: string[] = [];
    let stop = false;
    const tick = () => {
      const stage = document.querySelector("[data-slot=workbench-stage]");
      const visible = (el: Element) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      };
      const any = (selector: string) =>
        [...(stage?.querySelectorAll(selector) ?? [])].some((el) =>
          visible(el),
        );
      // The Shell's own locale gate shows a page-shaped skeleton.
      seen.push(
        any("[data-slot=spinner], [role=status][aria-label=Loading]")
          ? "spinner"
          : any("[data-occupant]")
            ? "occupant"
            : any("[data-template]")
              ? "template"
              : any("[data-slot=workbench-page] [data-slot=skeleton]")
                ? "shell-skeleton"
                : "empty",
      );
      if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    Object.assign(window, {
      stopWatching: () => {
        stop = true;
        return seen;
      },
    });
  });
const stopWatching = (page: Page) =>
  page.evaluate(() => {
    const stop: unknown = Reflect.get(window, "stopWatching");
    if (typeof stop !== "function") throw new Error("Not watching");
    const seen: unknown = stop();
    return Array.isArray(seen) ? seen.map(String) : [];
  });

async function during(page: Page, act: () => Promise<void>, until: string) {
  await watch(page);
  await act();
  await page.locator(until).first().waitFor();
  await settle(page);
  return stopWatching(page);
}

test("the stage is never empty, and never a spinner, through a switch", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await open(page, "?occupant=queue");
  await page.locator("[data-slot=workbench-stage] [data-occupant]").waitFor();
  const radio = (name: string) =>
    page.getByRole("radio", { name, exact: true });
  const row = (name: string) =>
    page
      .locator("#workbench-list li")
      .filter({ hasText: name })
      .getByRole("button")
      .first();
  const runs = [
    await during(
      page,
      () => radio("Template").click(),
      "[data-slot=workbench-page] [data-occupant]",
    ),
    await during(
      page,
      () => radio("Surface").click(),
      "[data-slot=workbench-stage] [data-slot=occupant-fixture] [data-occupant]",
    ),
    await during(
      page,
      () => row("Participants").click(),
      "[data-slot=workbench-stage] [data-occupant=participants]",
    ),
  ];
  for (const seen of runs) {
    expect(seen.length).toBeGreaterThan(0);
    expect(seen).not.toContain("empty");
    expect(seen).not.toContain("spinner");
  }
  // Within a view, a new occupant replaces the last one with no gap at all.
  expect(new Set(runs[2])).toEqual(new Set(["occupant"]));
  expect(new Set(runs[1])).not.toContain("shell-skeleton");
});
