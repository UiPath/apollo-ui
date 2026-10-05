import type { TemplateHost } from "@/app/_components/template-hosts";
import type { TemplateSpec } from "@/lib/composition";

/*
 * Test only: a second template, to prove the workbench needs nothing but
 * a template's spec. Two slots side by side, taking different surfaces;
 * the body holds one occupant, the aside a panel, and the aside can be
 * left out or closed. Registered only in the tests that
 * use it, never in the docs, nav, or shipped registry.
 */

export const twoUpTemplate = {
  name: "two-up",
  slots: [
    { name: "body", required: true, surfaces: ["content-area"] },
    // One slot of each capacity: the aside holds tabs and stacks.
    {
      name: "aside",
      required: false,
      surfaces: ["side-panel"],
      holds: "panel",
    },
  ],
  layout: {
    columns: [
      { name: "body", size: 3 },
      { name: "aside", size: 1 },
    ],
    rows: [{ name: "page", size: 1 }],
    areas: {
      body: { columns: ["body", "body"], rows: ["page", "page"] },
      aside: { columns: ["aside", "aside"], rows: ["page", "page"] },
    },
    options: { aside: { optional: true, closable: true } },
  },
} as const satisfies TemplateSpec;

export const TWO_UP_HOST: TemplateHost = {
  spec: twoUpTemplate,
  label: "Two-up",
  slotLabels: { body: "Body", aside: "Aside" },
  minWidth: 720,
  Frame: () => null,
};
