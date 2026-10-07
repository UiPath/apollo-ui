import { init, t } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { TEMPLATE_HOSTS } from "@/app/_components/template-hosts";
import { isLocalLink, shareLink } from "@/app/preview/occupants/export-link";
import {
  type ComposedPage,
  reviewSummary,
  summaryMarkdown,
  type Translate,
} from "@/app/preview/occupants/export-summary";
import { parseContents } from "@/app/preview/occupants/workbench-contents-url";
import {
  occupantTarget,
  rename,
} from "@/app/preview/occupants/workbench-renames";
import en from "@/locales/en.json";
import { TWO_UP_HOST } from "./fixtures/two-up-template";

// Export's Share for review: a summary in words, from the composition and
// the template's spec alone, for any template, and the link it shares.

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
  const markdown = (host: typeof detail, page: ComposedPage) =>
    summaryMarkdown(reviewSummary(host, page, words, shellName));

  it("gives each slot one entry in order: its state, placement, and what it holds", () => {
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
    // A hidden slot names no placement; a stack's occupants take the
    // commas, so its tabs take semicolons.
    expect(markdown(detail, page)).toBe(
      [
        "# Detail page",
        "",
        "Page width 1440px, shell: Default (sidebar).",
        "",
        "- **Header**: Stage strip",
        "- **Start panel** · hidden: Participants",
        "- **Main**: Queue",
        "- **End panel** · closed, beside header: Shipment (preview name); Overview: Activity timeline, Participants (2 tabs)",
        "",
      ].join("\n"),
    );
  });

  it("joins plain tabs with commas, and says when a slot is empty", () => {
    const page: ComposedPage = {
      contents: contentsOf(
        detail,
        "end-panel-contents=activity-timeline~participants",
      ),
      layout: { "end-panel": { open: false } },
      renames: {},
      shell: "sidebar",
      pageWidth: 1440,
    };
    const { entries } = reviewSummary(detail, page, words, shellName);
    expect(entries.map((e) => `${e.name}${e.rest}`)).toEqual([
      "Header: Empty",
      "Start panel · open, below header: Empty",
      "Main: Empty",
      "End panel · closed, below header: Activity timeline, Participants (2 tabs)",
    ]);
  });

  it("reads the same for any template: the two-up", () => {
    const page: ComposedPage = {
      contents: contentsOf(TWO_UP_HOST, "body-contents=queue"),
      layout: { aside: { open: false } },
      renames: {},
      shell: "minimal",
      pageWidth: 1200,
    };
    expect(markdown(TWO_UP_HOST, page)).toBe(
      [
        "# Two-up",
        "",
        "Page width 1200px, shell: Minimal.",
        "",
        "- **Body**: Queue",
        "- **Aside** · closed: Empty",
        "",
      ].join("\n"),
    );
  });
});

describe("the shared link", () => {
  const address = (href: string) => new URL(href);

  it("is the page's own address when no public base is set", () => {
    const here = address(
      "http://localhost:3000/preview/occupants?view=template#x",
    );
    expect(shareLink(here, "", "")).toBe(here.href);
    expect(isLocalLink(shareLink(here, "", ""))).toBe(true);
  });

  it("moves the path, query and hash onto the public base", () => {
    const here = address(
      "http://localhost:3000/preview/occupants?view=template&mode=edit",
    );
    const link = shareLink(here, "https://org.uipath.host/apollo-vertex/", "");
    expect(link).toBe(
      "https://org.uipath.host/apollo-vertex/preview/occupants?view=template&mode=edit",
    );
    expect(isLocalLink(link)).toBe(false);
  });

  it("drops this build's own sub-path before adding the base", () => {
    const here = address(
      "https://org.uipath.host/apollo-vertex-pr-12/preview/occupants/?view=template",
    );
    expect(
      shareLink(
        here,
        "https://org.uipath.host/apollo-vertex",
        "apollo-vertex-pr-12",
      ),
    ).toBe(
      "https://org.uipath.host/apollo-vertex/preview/occupants/?view=template",
    );
  });

  it("knows a link only this computer opens", () => {
    for (const link of [
      "http://127.0.0.1:3000/",
      "http://[::1]:3000/",
      "http://app.localhost/",
    ])
      expect(isLocalLink(link)).toBe(true);
    expect(
      isLocalLink("https://engdogfood.staging.uipath.host/apollo-vertex-pr-1/"),
    ).toBe(false);
  });
});
