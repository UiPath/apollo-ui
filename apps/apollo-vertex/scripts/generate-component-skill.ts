/**
 * Generates the vertex-component-catalog agent skill from the component and
 * pattern docs pages.
 *
 *   node --experimental-strip-types scripts/generate-component-skill.ts [--check]
 *
 * Each page contributes its title, description, guidance frontmatter
 * (whenToUse, avoidWhen, example) and the package exports declared in its
 * registry directories. Groups follow the separators in meta.json.
 *
 * --check fails when the committed SKILL.md differs from the generated one.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { frontmatter } from "fumadocs-core/content/md/frontmatter";
import ts from "typescript";
import { type DocsPageData, docsPageSchema } from "../lib/page-schema.ts";

const appRoot = resolve(import.meta.dirname, "..");
const docsRoot = join(appRoot, "content/docs");
const packageRoot = resolve(appRoot, "../../packages/apollo-vertex");
const skillName = "vertex-component-catalog";
const skillPath = join(packageRoot, "skills", skillName, "SKILL.md");
const maxLines = 480;
const sections = [
  { dir: "components", title: undefined },
  { dir: "patterns", title: "Patterns" },
];
const separatorRe = /^---(?:\[[^\]]+])?(?<name>.+)---$/;

interface Page {
  slug: string;
  dir: string;
  data: DocsPageData;
}

interface Group {
  title: string;
  pages: Page[];
}

function readPage(dir: string, slug: string): Page {
  const file = join(docsRoot, dir, `${slug}.mdx`);
  const result = docsPageSchema.safeParse(
    frontmatter(readFileSync(file, "utf8")).data,
  );
  if (!result.success) {
    throw new Error(`${relative(appRoot, file)}: ${result.error.message}`);
  }
  return { slug, dir, data: result.data };
}

function readGroups(): Group[] {
  const groups: Group[] = [];
  for (const section of sections) {
    const meta = JSON.parse(
      readFileSync(join(docsRoot, section.dir, "meta.json"), "utf8"),
    ) as { title: string; pages: string[] };
    let group: Group = { title: section.title ?? meta.title, pages: [] };
    groups.push(group);
    for (const entry of meta.pages) {
      const separator = separatorRe.exec(entry);
      if (separator?.groups) {
        group = { title: separator.groups.name.trim(), pages: [] };
        groups.push(group);
      } else if (entry !== "...") {
        group.pages.push(readPage(section.dir, entry));
      }
    }
  }
  return groups.filter((group) => group.pages.length > 0);
}

function assertAllPagesListed(groups: Group[]) {
  const listed = new Set(
    groups.flatMap((group) => group.pages.map((p) => `${p.dir}/${p.slug}`)),
  );
  const unlisted = sections.flatMap(({ dir }) =>
    readdirSync(join(docsRoot, dir))
      .filter((file) => file.endsWith(".mdx") && file !== "index.mdx")
      .map((file) => `${dir}/${file.replace(/\.mdx$/, "")}`)
      .filter((path) => !listed.has(path)),
  );
  if (unlisted.length > 0) {
    throw new Error(
      `Add these pages to their meta.json so the catalog can group them: ${unlisted.join(", ")}`,
    );
  }
}

// Value exports of the package root, keyed by the registry directory that
// declares them.
function readPackageExports(): Map<string, string[]> {
  const configPath = join(packageRoot, "tsconfig.json");
  const config = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );
    },
  });
  if (!config) throw new Error(`Cannot read ${configPath}`);
  const entry = join(packageRoot, "entries/index.ts");
  const program = ts.createProgram([entry], config.options);
  const checker = program.getTypeChecker();
  const entrySource = program.getSourceFile(entry);
  const entrySymbol = entrySource && checker.getSymbolAtLocation(entrySource);
  if (!entrySymbol) throw new Error(`Cannot resolve ${entry}`);

  const registryRoot = join(packageRoot, "registry");
  const exportsByDir = new Map<string, string[]>();
  for (const symbol of checker.getExportsOfModule(entrySymbol)) {
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    if (!(target.flags & ts.SymbolFlags.Value)) continue;
    const file = target.declarations?.[0]?.getSourceFile().fileName;
    if (!file) continue;
    const path = relative(registryRoot, file);
    if (path.startsWith("..") || isAbsolute(path)) continue;
    const dir = path.split(sep)[0];
    exportsByDir.set(dir, [...(exportsByDir.get(dir) ?? []), symbol.name]);
  }
  return exportsByDir;
}

function exportsFor(page: Page, exportsByDir: Map<string, string[]>) {
  const dirs = page.data.registry ?? [page.slug];
  const names = dirs.flatMap((dir) => {
    const found = exportsByDir.get(dir);
    if (!found) {
      throw new Error(
        `${page.dir}/${page.slug}.mdx: no package exports from registry/${dir}. ` +
          "Set `registry` in its frontmatter.",
      );
    }
    return found;
  });
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

function render(groups: Group[], exportsByDir: Map<string, string[]>) {
  const pagesBySlug = new Map(
    groups.flatMap((group) => group.pages.map((page) => [page.slug, page])),
  );
  const lines = [
    "---",
    `name: ${skillName}`,
    "description: >",
    "  Catalog of every documented @uipath/apollo-vertex component and pattern,",
    "  grouped by need (actions, inputs, forms, overlays, menus, layout, data",
    "  display, feedback, charts), with the names to import, when to use each one",
    "  and which component to use instead. Load when choosing which Vertex",
    "  component to build a screen, form, dialog, table or state from.",
    "metadata:",
    "  type: core",
    "  library: '@uipath/apollo-vertex'",
    "sources:",
    ...sections.flatMap(({ dir }) => [
      `  - 'UiPath/apollo-ui:apps/apollo-vertex/content/docs/${dir}/*.mdx'`,
      `  - 'UiPath/apollo-ui:apps/apollo-vertex/content/docs/${dir}/meta.json'`,
    ]),
    "  - 'UiPath/apollo-ui:packages/apollo-vertex/entries/index.ts'",
    "---",
    "",
    "<!-- Generated by apps/apollo-vertex/scripts/generate-component-skill.ts from the",
    "docs pages. Do not edit by hand. -->",
    "",
    "# Apollo Vertex component catalog",
    "",
    "Import every name below from `@uipath/apollo-vertex`. Follow the",
    "`use-vertex-components` skill for how to use and adapt them.",
  ];

  for (const group of groups) {
    lines.push("", `## ${group.title}`, "");
    for (const page of group.pages) {
      const { title, description, whenToUse, avoidWhen, example } = page.data;
      const names = exportsFor(page, exportsByDir)
        .map((name) => `\`${name}\``)
        .join(", ");
      lines.push(
        `- **${title}**: ${description ? `${description} ` : ""}Exports: ${names}.`,
      );
      for (const when of whenToUse ?? []) lines.push(`  - Use when ${when}`);
      for (const avoid of avoidWhen ?? []) {
        const alternative = avoid.use && pagesBySlug.get(avoid.use);
        if (avoid.use && !alternative) {
          throw new Error(
            `${page.dir}/${page.slug}.mdx: avoidWhen.use "${avoid.use}" is not a component page`,
          );
        }
        lines.push(
          alternative
            ? `  - Avoid when ${avoid.when} Use **${alternative.data.title}** instead.`
            : `  - Avoid when ${avoid.when}`,
        );
      }
      if (example) {
        lines.push(
          "",
          "    ```tsx",
          ...example
            .trimEnd()
            .split("\n")
            .map((line) => `    ${line}`.trimEnd()),
          "    ```",
          "",
        );
      }
    }
  }
  return `${lines.join("\n").replaceAll(/\n{3,}/g, "\n\n")}\n`;
}

const groups = readGroups();
assertAllPagesListed(groups);
const output = render(groups, readPackageExports());
const lineCount = output.split("\n").length;
if (lineCount > maxLines) {
  throw new Error(
    `${skillName} is ${lineCount} lines, over the ${maxLines} line budget. ` +
      "Shorten guidance or examples, or split the catalog into several skills.",
  );
}

const relativeSkillPath = relative(process.cwd(), skillPath);
if (process.argv.includes("--check")) {
  const current = existsSync(skillPath) ? readFileSync(skillPath, "utf8") : "";
  if (current !== output) {
    console.error(
      `${relativeSkillPath} is out of date. Run \`pnpm --filter apollo-vertex skills:generate\`.`,
    );
    process.exit(1);
  }
  console.log(`${relativeSkillPath} is up to date`);
} else {
  mkdirSync(dirname(skillPath), { recursive: true });
  writeFileSync(skillPath, output);
  console.log(`Generated ${relativeSkillPath} (${lineCount} lines)`);
}
