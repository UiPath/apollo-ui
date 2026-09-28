import type { TemplateSpec } from "@/lib/composition";

export const detailPageTemplate = {
  name: "detail-page",
  slots: [
    { name: "header", required: true, surfaces: ["page-header"] },
    { name: "start-panel", required: false, surfaces: ["side-panel"] },
    { name: "main", required: true, surfaces: ["content-area"] },
    { name: "end-panel", required: false, surfaces: ["side-panel"] },
  ],
} as const satisfies TemplateSpec;

export type DetailPageSlotName =
  (typeof detailPageTemplate.slots)[number]["name"];
