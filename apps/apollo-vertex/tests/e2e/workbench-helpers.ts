import type { Page } from "@playwright/test";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { overflowProblems } from "@/lib/overflow-problems";
import { axeViolations as axeIn } from "./axe";

/*
 * Shared by the workbench specs: opening it, reading its state, and
 * scanning it.
 */

export const open = async (page: Page, query = "") => {
  await page.goto(`/preview/occupants${query}`);
  await page.locator("[data-slot=workbench]").waitFor();
};
export const floorMeasured = (page: Page) =>
  page
    .locator("[data-slot=workbench-spec-value][data-term='Measured floor']")
    .filter({ hasNotText: "Measuring" })
    // It's in the details panel, which starts closed.
    .waitFor({ state: "attached" });
export const stage = (page: Page) =>
  page.locator("[data-slot=workbench-stage]");
export const status = (page: Page) =>
  page.locator("[data-slot=workbench-status]");
export const urlQuery = (page: Page) => new URL(page.url()).search;

/** Picks a Sample or State option, as toggles or as a compact select. */
export async function choose(page: Page, label: string, option: string) {
  const select = page.getByRole("combobox", { name: label });
  if (await select.isVisible()) {
    await select.click();
    await page.getByRole("option", { name: option, exact: true }).click();
  } else {
    await page.getByRole("radio", { name: option, exact: true }).click();
  }
}

/**
 * The colors that show which theme the workbench is in: its ground, the
 * dock, both panels' text, and the occupant's first card.
 */
export const themeColors = (page: Page) =>
  page.evaluate(() => {
    const style = (selector: string, property: "backgroundColor" | "color") => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el)[property] : "missing";
    };
    return [
      style("[data-slot=workbench]", "backgroundColor"),
      style("[data-slot=workbench-dock]", "backgroundColor"),
      style("#workbench-list h1", "color"),
      style("#workbench-details h2", "color"),
      style(
        "[data-slot=workbench-stage] [data-occupant] button",
        "backgroundColor",
      ),
      style("[data-slot=workbench-stage] [data-occupant] p", "color"),
    ];
  });

/**
 * The status the workbench shows, and what the occupant checks' overflow
 * function finds on the stage, once the workbench has measured this width.
 */
export async function statusAt(page: Page, query: string, surface: string) {
  await open(page, `${query}&details=open`);
  await page.locator("[data-slot=workbench-overflow]").waitFor();
  const problems = await stage(page)
    .locator(`[data-slot=occupant-fixture] ${SURFACE_HOSTS[surface]?.inner}`)
    .first()
    .evaluate(overflowProblems);
  return { status: await status(page).innerText(), problems };
}

/** Each Detail page panel slot's open or closed state, by its data-slot. */
export const slotStates = (page: Page) =>
  page
    .locator("[data-template=detail-page] > [data-state]")
    .evaluateAll((slots) => {
      const states: Record<string, string> = {};
      for (const slot of slots)
        if (slot instanceof HTMLElement)
          states[slot.dataset.slot ?? ""] = slot.dataset.state ?? "";
      return states;
    });

/** axe violations inside the workbench, leaving out anything inside `exclude`. */
export const axeViolations = (page: Page, exclude: readonly string[] = []) =>
  axeIn(page, "[data-slot=workbench]", exclude);

/** The template view's inspector, the one place to edit a slot. */
export const inspector = (page: Page) =>
  page.locator("[data-slot=workbench-inspector]");

/** Switches the template view to Edit or Preview, from the header. */
export async function setMode(page: Page, mode: "Edit" | "Preview") {
  const toggle = page
    .getByRole("group", { name: "Mode" })
    .getByRole("radio", { name: mode });
  if ((await toggle.getAttribute("aria-checked")) !== "true")
    await toggle.click();
  await toggle.and(page.locator("[aria-checked=true]")).waitFor();
}

/**
 * Selects a slot, or its ghost, on the stage in Edit mode, and waits for
 * the inspector to show it.
 */
export async function selectSlot(page: Page, slot: string) {
  await setMode(page, "Edit");
  const button = page.locator(
    `[data-edit-slot="${slot}"], [data-ghost-slot="${slot}"]`,
  );
  if ((await button.getAttribute("aria-pressed")) !== "true")
    await button.click();
  await inspector(page)
    .and(page.locator(`[data-inspector-slot="${slot}"]`))
    .waitFor();
}

/** A layout switch in the inspector, by its name: "Show End panel in the page". */
export const layoutSwitch = (page: Page, name: string) =>
  inspector(page).getByRole("switch", { name, exact: true });

/** Turns a layout switch on or off, unless it already is. */
export async function setSwitch(page: Page, name: string, on: boolean) {
  const control = layoutSwitch(page, name);
  if ((await control.getAttribute("aria-checked")) !== String(on))
    await control.click();
  await control.and(page.locator(`[aria-checked="${on}"]`)).waitFor();
}
