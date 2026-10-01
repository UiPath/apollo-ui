import { createRequire } from "node:module";
import type { Page } from "@playwright/test";

const AXE = createRequire(__filename).resolve("axe-core/axe.min.js");

/**
 * axe violations inside the first element matching `context`, as "rule:
 * targets", leaving out anything inside `exclude`.
 */
export async function axeViolations(
  page: Page,
  context: string,
  exclude: readonly string[] = [],
) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(
    async ({ selector, excluded }) => {
      const { axe } = window as unknown as {
        axe: {
          run: (
            context: Element | { include: Element[]; exclude: string[][] },
          ) => Promise<{
            violations: { id: string; nodes: { target: string[] }[] }[];
          }>;
        };
      };
      const root = document.querySelector(selector)!;
      const result = await axe.run(
        excluded.length > 0
          ? { include: [root], exclude: excluded.map((s) => [s]) }
          : root,
      );
      return result.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
    },
    { selector: context, excluded: [...exclude] },
  );
}
