import { init, t } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { pictureSvg } from "@/app/preview/occupants/export-picture";
import {
  type ComposedPage,
  exportSummary,
  type Translate,
} from "@/app/preview/occupants/export-summary";
import { parseContents } from "@/app/preview/occupants/workbench-contents-url";
import {
  occupantTarget,
  rename,
} from "@/app/preview/occupants/workbench-renames";
import en from "@/locales/en.json";
import { TWO_UP_HOST } from "./fixtures/two-up-template";

// Export's Share for review: a summary in words and a picture, from the
// composition and the template's spec alone, for any template.

beforeAll(async () => {
  await init({ lng: "en", resources: { en: { translation: en } } });
});

const words: Translate = (key, values) => t(key, values);
const shellName = (shell: string) =>
  shell === "sidebar" ? "Default (sidebar)" : "Minimal";
const detail = TEMPLATE_HOSTS["detail-page"];
if (!detail) throw new Error("No Detail page host");
const contentsOf = (host: typeof detail, query: string) =>
  parseContents(host, new URLSearchParams(query));

describe("the review summary", () => {
  it("names each slot in order, its state, placement, and what it holds", () => {
    const page: ComposedPage = {
      contents: contentsOf(
        detail,
        "header-contents=stage-strip&start-panel-contents=participants&main-contents=queue&end-panel-contents=key-facts~overview:activity-timeline.participants",
      ),
      layout: {
        "start-panel": { present: false },
        "end-panel": { open: false, placement: "beside-header" },
      },
      renames: rename({}, occupantTarget("key-facts"), "Shipment"),
      shell: "sidebar",
      pageWidth: 1440,
    };
    expect(exportSummary(detail, page, words, shellName)).toBe(
      [
        "# Detail page",
        "",
        "Page width 1440px, shell: Default (sidebar).",
        "",
        "## Header",
        "",
        "Open.",
        "",
        "- Stage strip",
        "",
        "## Start panel",
        "",
        "Hidden, its contents kept.",
        "",
        "- Tab: Participants",
        "",
        "## Main",
        "",
        "Open.",
        "",
        "- Queue",
        "",
        "## End panel",
        "",
        "Closed, beside header.",
        "",
        "- Tab: Shipment (preview name)",
        "- Tab: Overview, a stack of Activity timeline, Participants",
        "",
      ].join("\n"),
    );
  });

  it("reads the same for any template: the two-up", () => {
    const page: ComposedPage = {
      contents: contentsOf(TWO_UP_HOST, "body-contents=queue"),
      layout: { aside: { open: false } },
      renames: {},
      shell: "minimal",
      pageWidth: 1200,
    };
    expect(exportSummary(TWO_UP_HOST, page, words, shellName)).toBe(
      [
        "# Two-up",
        "",
        "Page width 1200px, shell: Minimal.",
        "",
        "## Body",
        "",
        "Open.",
        "",
        "- Queue",
        "",
        "## Aside",
        "",
        "Closed.",
        "Empty.",
        "",
      ].join("\n"),
    );
  });
});

describe("the review picture", () => {
  const colors = {
    background: "#fff",
    foreground: "#111",
    muted: "#eee",
    border: "#ccc",
    mutedForeground: "#666",
  };
  it("draws the template's layout, the shell beside it, and names what's there", () => {
    const svg = pictureSvg({
      host: detail,
      layout: {
        "start-panel": { present: false },
        "end-panel": { open: false },
      },
      pageWidth: 1440,
      shellWidth: 280,
      shellName: "Default (sidebar)",
      words: (slot) => [
        slot === "main" ? "Main" : slot,
        slot === "main" ? "Queue" : "",
      ],
      colors,
    });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    // Hidden slots aren't drawn; a closed one is, dashed, with no words.
    const regions = [...svg.matchAll(/data-region="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(regions).toEqual(["header", "main", "end-panel"]);
    expect(svg).toMatch(/stroke-dasharray="6 4" data-region="end-panel"/);
    expect(svg).toContain(">Default (sidebar)<");
    expect(svg).toContain(">Queue<");
  });

  it("draws any template, with no shell when it has no width", () => {
    const svg = pictureSvg({
      host: TWO_UP_HOST,
      layout: {},
      pageWidth: 1200,
      shellWidth: 0,
      shellName: "Minimal",
      words: (slot) => [slot === "body" ? "Body" : "Aside"],
      colors,
    });
    expect(
      [...svg.matchAll(/data-region="([^"]+)"/g)].map((m) => m[1]),
    ).toEqual(["body", "aside"]);
    expect(svg).not.toContain(">Minimal<");
  });
});
