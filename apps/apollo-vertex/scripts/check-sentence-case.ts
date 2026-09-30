/**
 * pnpm check:sentence-case
 *
 * Occupant copy is in sentence case: only the first word of a sentence, and
 * proper nouns and acronyms, start with a capital. It checks, for the kit
 * and every registered occupant:
 *
 *   - the spec's label, and the registry item's title and description
 *   - its copy in locales/en.json (occupant_ and <name>_ keys)
 *   - its Patterns nav title, and its Patterns page's title and headings
 *
 * Example data (names, companies) isn't copy, so it isn't checked. A proper
 * noun that should stay capitalized goes in PROPER_NOUNS. It runs in lint.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/** Words that keep their capital anywhere in a sentence. */
const PROPER_NOUNS = new Set(["Apollo", "Claude", "UiPath", "Vertex"]);

/** The words after a sentence's first that wrongly start with a capital. */
function titleCased(text: string): string[] {
  const plain = text
    .replaceAll(/\{\{[^}]*\}\}/g, "x")
    .replaceAll(/`[^`]*`/g, "x")
    .replaceAll(/<[^>]*>/g, " ");
  const wrong: string[] = [];
  // A separator (a middle dot, a bar) starts a new phrase, like a sentence.
  for (const sentence of plain.split(/[.!?:]\s+|\s[·|]\s?/)) {
    const words = sentence.trim().split(/\s+/).slice(1);
    for (const raw of words) {
      const word = raw.replaceAll(/^[("'“‘]+|[)"'”’,;]+$/g, "");
      // Acronyms (PO, SSO, AI) and proper nouns keep their capitals.
      if (!/^[A-Z][a-z]/.test(word) || PROPER_NOUNS.has(word)) continue;
      wrong.push(word);
    }
  }
  return wrong;
}

interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  meta?: { layer?: string };
}
const registry: { items: RegistryItem[] } = JSON.parse(read("registry.json"));
const occupants = registry.items.filter((i) => i.meta?.layer === "occupant");
const kit = registry.items.find((i) => i.name === "occupant");
const en: Record<string, string> = JSON.parse(read("locales/en.json"));
const nav = read("app/patterns/_meta.ts");

const copy: [where: string, text: string][] = [];
for (const item of [...(kit ? [kit] : []), ...occupants]) {
  if (item.title) copy.push([`registry.json ${item.name} title`, item.title]);
  if (item.description)
    copy.push([`registry.json ${item.name} description`, item.description]);
  const prefix = `${item.name.replaceAll("-", "_")}_`;
  for (const [key, value] of Object.entries(en))
    if (key.startsWith(prefix)) copy.push([`locales/en.json ${key}`, value]);
}
for (const { name } of occupants) {
  const spec = `registry/${name}/${name}.occupant.ts`;
  const label = existsSync(join(root, spec))
    ? read(spec).match(/label:\s*"([^"]*)"/)?.[1]
    : undefined;
  if (label) copy.push([`${spec} label`, label]);
  const title = nav.match(new RegExp(`"?${name}"?:\\s*"([^"]*)"`))?.[1];
  if (title) copy.push([`app/patterns/_meta.ts ${name}`, title]);
  const page = `app/patterns/${name}/page.mdx`;
  if (existsSync(join(root, page)))
    for (const heading of [
      // The page title, in frontmatter: the page heading is rendered for it.
      ...(read(page).match(/^title: .+$/m) ?? []).map((t) =>
        t.replace(/^title: /, ""),
      ),
      ...(read(page).match(/^#{1,6} .+$/gm) ?? []).map((h) =>
        h.replace(/^#+ /, ""),
      ),
    ])
      copy.push([page, heading]);
}

const problems = copy.flatMap(([where, text]) => {
  const wrong = titleCased(text);
  return wrong.length
    ? [`${where}: "${text}" (lowercase ${wrong.join(", ")})`]
    : [];
});
if (problems.length) {
  console.error(
    `Sentence case: capitalize only the first word, proper nouns, and acronyms.\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(`Sentence case: ${copy.length} pieces of occupant copy checked.`);
