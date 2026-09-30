import { createRequire } from "node:module";
import type { Page } from "@playwright/test";

const AXE = createRequire(__filename).resolve("axe-core/axe.min.js");

/** axe violations inside the first element matching `context`, as "rule: targets". */
export async function axeViolations(page: Page, context: string) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async (selector) => {
    const { axe } = window as unknown as {
      axe: {
        run: (context: Element) => Promise<{
          violations: { id: string; nodes: { target: string[] }[] }[];
        }>;
      };
    };
    const result = await axe.run(document.querySelector(selector)!);
    return result.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
  }, context);
}
