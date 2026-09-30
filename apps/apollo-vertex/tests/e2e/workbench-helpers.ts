import { createRequire } from "node:module";
import type { Page } from "@playwright/test";

/*
 * Shared by the workbench specs: opening it, reading its state, and
 * scanning it.
 */

const AXE = createRequire(__filename).resolve("axe-core/axe.min.js");

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
export const search = (page: Page) => new URL(page.url()).search;

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

/** The status and the overflow check, once the check has measured this width. */
export async function statusAt(page: Page, query: string) {
  await open(page, `${query}&details=open`);
  const check = page.locator("[data-slot=workbench-overflow]");
  await check.waitFor();
  return {
    status: await status(page).getAttribute("data-status"),
    overflows: (await check.innerText()).startsWith("Overflows"),
  };
}

/** Each Detail page panel slot's open or closed state, by its data-slot. */
export const panelStates = (page: Page) =>
  page
    .locator("[data-template=detail-page] > [data-state]")
    .evaluateAll((slots) => {
      const states: Record<string, string> = {};
      for (const slot of slots)
        if (slot instanceof HTMLElement)
          states[slot.dataset.slot ?? ""] = slot.dataset.state ?? "";
      return states;
    });

/** axe violations inside the workbench, as "rule: targets". */
export async function axeViolations(page: Page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const { axe } = window as unknown as {
      axe: {
        run: (context: Element) => Promise<{
          violations: { id: string; nodes: { target: string[] }[] }[];
        }>;
      };
    };
    const result = await axe.run(
      document.querySelector("[data-slot=workbench]")!,
    );
    return result.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
  });
}
