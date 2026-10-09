import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot } from "./workbench-helpers";

/*
 * Export, from the template view's header: a dialog of sections, for now
 * one, Share for review. Its link, its summary (formatted, copied as
 * Markdown), and a screenshot of the page frame with its thumbnail,
 * copied or downloaded, each with a toast; focus in at Copy link and back out. The dev server has no public base URL,
 * so the link is this computer's; the base is unit tested.
 */

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const PAGE =
  "?view=template&header-contents=stage-strip&start-panel-contents=participants&start-panel-present=false&main-contents=queue&end-panel-contents=key-facts~overview:activity-timeline.participants&end-panel-state=closed";

const dialog = (page: Page) =>
  page.locator("[data-slot=workbench-export-dialog]");
const exportButton = (page: Page) =>
  page.getByRole("button", { name: "Export", exact: true });
const toast = (page: Page) => page.locator("[data-sonner-toast]");
const clipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

async function ready(page: Page, query = PAGE) {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await open(page, query);
  await page
    .locator("[data-slot=workbench-page] [data-occupant=queue]")
    .waitFor();
  await settle(page);
}

for (const mode of ["Preview", "Edit"] as const) {
  test(`Export opens from ${mode}: focus moves in, Escape closes it and goes back`, async ({
    page,
  }) => {
    await ready(page, mode === "Edit" ? `${PAGE}&mode=edit` : PAGE);
    await exportButton(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(
      dialog(page).getByRole("heading", { name: "Export Detail page" }),
    ).toBeVisible();
    await expect(
      dialog(page).locator("[data-slot=workbench-export-counts]"),
    ).toHaveText("4 slots in use · 5 occupants on the page");
    // Focus is in it, at Copy link; the read-only field isn't selected.
    await expect(
      dialog(page).getByRole("button", { name: "Copy the link to this page" }),
    ).toBeFocused();
    const field = dialog(page).locator("[data-slot=workbench-export-link]");
    await expect(field).toHaveAttribute("readonly", "");
    expect(
      await field.evaluate(
        (el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!,
      ),
    ).toBe(0);
    // One section: no navigation, no placeholders.
    await expect(dialog(page).getByRole("navigation")).toHaveCount(0);
    await expect(
      dialog(page).locator("[data-slot=workbench-export-section]"),
    ).toHaveAttribute("data-section", "share");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(exportButton(page)).toBeFocused();
  });
}

test("Copy link copies this page's link, says so, and says it's only local", async ({
  page,
}) => {
  await ready(page);
  await exportButton(page).click();
  await expect(
    dialog(page).locator("[data-slot=workbench-export-local-note]"),
  ).toHaveText(
    "This link only works on your computer. Share the summary or a screenshot instead.",
  );
  await expect(
    dialog(page).locator("[data-slot=workbench-export-renames-note]"),
  ).toHaveCount(0);
  await dialog(page)
    .getByRole("button", { name: "Copy the link to this page" })
    .click();
  await expect(toast(page)).toContainText("Link copied");
  expect(await clipboard(page)).toBe(page.url());
  await expect(
    dialog(page).locator("[data-slot=workbench-export-link]"),
  ).toHaveValue(page.url());
});

test("the summary says what's on the page; renames are marked, and left out of the link", async ({
  page,
}) => {
  await ready(page, `${PAGE}&mode=edit`);
  // A preview-only name, from the inspector.
  await selectSlot(page, "end-panel");
  await inspector(page)
    .getByRole("button", { name: "Rename Key facts", exact: true })
    .click();
  await inspector(page)
    .getByRole("textbox", { name: "Rename Key facts" })
    .fill("Shipment");
  await page.keyboard.press("Enter");
  await exportButton(page).click();
  await expect(
    dialog(page).locator("[data-slot=workbench-export-renames-note]"),
  ).toHaveText("Preview-only names aren't included in the link.");
  const preview = dialog(page).getByRole("region", { name: "Summary preview" });
  // Formatted: a heading, the page, and a list of one entry per slot.
  await expect(
    preview.getByRole("heading", { name: "Detail page" }),
  ).toBeVisible();
  await expect(preview.getByRole("listitem")).toHaveText([
    "Header: Stage strip",
    "Start panel · hidden: Participants",
    "Main: Queue",
    "End panel · closed, below header: Shipment (preview name); Overview: Activity timeline, Participants (2 tabs)",
  ]);
  await expect(preview).not.toContainText("**");
  // Four slots fit without scrolling, the preview and the dialog both.
  expect(
    await preview.evaluate((el) => el.scrollHeight - el.clientHeight),
  ).toBeLessThanOrEqual(0);
  const box = await dialog(page).boundingBox();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(1000);
  const expected = [
    "# Detail page",
    "",
    "Page width 1440px, shell: Default (sidebar).",
    "",
    "- **Header**: Stage strip",
    "- **Start panel** · hidden: Participants",
    "- **Main**: Queue",
    "- **End panel** · closed, below header: Shipment (preview name); Overview: Activity timeline, Participants (2 tabs)",
    "",
  ].join("\n");
  await dialog(page)
    .getByRole("button", { name: "Copy the summary as Markdown" })
    .click();
  await expect(toast(page)).toContainText("Summary copied");
  expect(await clipboard(page)).toBe(expected);
});

/** A PNG's width and height, from its header. */
const pngSize = (bytes: Buffer) => [
  bytes.readUInt32BE(16),
  bytes.readUInt32BE(20),
];

/** Downloads the screenshot, and checks it's a PNG named for the template. */
async function downloadScreenshot(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog(page)
      .getByRole("button", {
        name: "Download a screenshot of the page as a PNG",
      })
      .click(),
  ]);
  expect(download.suggestedFilename()).toBe("detail-page-screenshot.png");
  const bytes = await readFile(await download.path());
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await expect(toast(page)).toContainText("Screenshot downloaded");
  return bytes;
}

/** The page frame's real size, unscaled, at twice the pixels. */
const frameAt2x = (page: Page) =>
  page
    .locator("[data-slot=workbench-page]")
    .evaluate((el: HTMLElement) => [el.offsetWidth * 2, el.offsetHeight * 2]);

test("Download PNG captures the page frame at its real size, twice the pixels, and the thumbnail is that capture", async ({
  page,
}) => {
  await ready(page);
  // The stage fits the page, so it's shown smaller than it is.
  expect(
    Number(await page.locator("[data-zoom]").getAttribute("data-zoom")),
  ).toBeLessThan(100);
  const size = await frameAt2x(page);
  expect(size[0]).toBe(2880);
  await exportButton(page).click();
  const thumbnail = dialog(page).getByRole("img", {
    name: "Screenshot of the page",
  });
  await expect(thumbnail).toBeVisible();
  const bytes = await downloadScreenshot(page);
  // The page's 1440px at 2x, not the stage's zoom.
  expect(pngSize(bytes)).toEqual(size);
  // The thumbnail is the download's own capture.
  const src = (await thumbnail.getAttribute("src")) ?? "";
  expect(src.startsWith("data:image/png;base64,")).toBe(true);
  expect(
    Buffer.from(src.slice(src.indexOf(",") + 1), "base64").equals(bytes),
  ).toBe(true);
});

/**
 * The share of pixels two PNGs of one size visibly differ in (by more
 * than 24 of 255 on a channel): text antialiasing shifts a few.
 */
const differing = (page: Page, a: Buffer, b: Buffer) =>
  page.evaluate(
    async ([first, second]) => {
      const pixels = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d");
        context?.drawImage(image, 0, 0);
        return context?.getImageData(0, 0, image.width, image.height).data;
      };
      const [x, y] = [await pixels(first), await pixels(second)];
      if (!x || !y || x.length !== y.length) return 1;
      let off = 0;
      for (let i = 0; i < x.length; i += 4)
        if (
          Math.max(
            Math.abs((x[i] ?? 0) - (y[i] ?? 0)),
            Math.abs((x[i + 1] ?? 0) - (y[i + 1] ?? 0)),
            Math.abs((x[i + 2] ?? 0) - (y[i + 2] ?? 0)),
          ) > 24
        )
          off += 1;
      return off / (x.length / 4);
    },
    [a.toString("base64"), b.toString("base64")],
  );

// Edit changes how the stage shows the page, not its screenshot. At 100%
// the page is the stage's height in both, so the two are the same size.
test("in Edit, the capture is Preview's: no outlines, no fade", async ({
  page,
}) => {
  const capture = async (extra: string) => {
    await ready(page, `${PAGE}&zoom=100${extra}`);
    const size = await frameAt2x(page);
    await exportButton(page).click();
    const bytes = await downloadScreenshot(page);
    expect(pngSize(bytes)).toEqual(size);
    return bytes;
  };
  const preview = await capture("");
  // Edit's outlines or its fade would differ over most of the page.
  expect(
    await differing(page, await capture("&mode=edit"), preview),
  ).toBeLessThan(0.001);
});

test("Copy image puts the screenshot on the clipboard as a PNG, and says so", async ({
  page,
}) => {
  await ready(page);
  const size = await frameAt2x(page);
  await exportButton(page).click();
  await expect(
    dialog(page).getByRole("heading", { name: "Screenshot", exact: true }),
  ).toBeVisible();
  // Before Download PNG.
  const buttons = dialog(page)
    .locator("[aria-labelledby=export-screenshot]")
    .getByRole("button");
  expect(
    await buttons.evaluateAll((all) =>
      all.map((button) => button.getAttribute("aria-label")),
    ),
  ).toEqual([
    "Copy the screenshot as a PNG image",
    "Download a screenshot of the page as a PNG",
  ]);
  await buttons.first().click();
  await expect(toast(page)).toContainText("Screenshot copied");
  // On the clipboard: a PNG the size of the capture.
  const copied = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    if (!item?.types.includes("image/png")) return null;
    const image = await createImageBitmap(await item.getType("image/png"));
    return [image.width, image.height];
  });
  expect(copied).toEqual(size);
});

test("Copy image is hidden where the browser can't copy images; Download PNG stays", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // As in a browser without clipboard images.
    Reflect.deleteProperty(window, "ClipboardItem");
  });
  await ready(page);
  await exportButton(page).click();
  await expect(
    dialog(page).getByRole("img", { name: "Screenshot of the page" }),
  ).toBeVisible();
  await expect(
    dialog(page).getByRole("button", {
      name: "Copy the screenshot as a PNG image",
    }),
  ).toHaveCount(0);
  await downloadScreenshot(page);
});
