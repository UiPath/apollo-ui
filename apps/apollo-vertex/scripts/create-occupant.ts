/**
 * pnpm create:occupant <name> [--label ...] [--icon ...] [--orientations ...]
 *   [--min-width ...] [--padding ...] [--scroll ...] [--surfaces ...] [--yes]
 *
 * Creates an occupant. It asks for anything not given as a flag, in plain
 * language, then writes:
 *
 *   registry/<name>/<name>.occupant.ts     the spec
 *   registry/<name>/<name>.view-model.ts   the neutral view model (a stub)
 *   registry/<name>/<name>.tsx             the component: <Occupant>, useSurface(),
 *                                          and the standard states
 *   registry/<name>/examples/              an example adapter and a stress adapter
 *                                          (not shipped)
 *   app/patterns/<name>/page.mdx           a Patterns page with "Where it fits"
 *
 * and registers it: a registry.json item (meta.layer "occupant"), a path alias,
 * the Patterns nav entry, its copy in locales/en.json, and the occupant index.
 * Previews with occupant pickers, the occupant checks, and the docs all read
 * the index, so there's nothing else to wire up.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const write = (path: string, content: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

// --- Arguments --------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const name = args.find(
  (a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"),
);
const assumeDefaults = args.includes("--yes");

const fail = (message: string): never => {
  console.error(`\ncreate:occupant: ${message}`);
  process.exit(1);
};

if (!name) fail("give the occupant a name: pnpm create:occupant <name>");
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name ?? "")) {
  fail(`"${name}" isn't lowercase and hyphenated, like "key-facts".`);
}
const occupantName = name as string;
if (existsSync(join(root, "registry", occupantName))) {
  fail(`registry/${occupantName} already exists.`);
}

const camel = occupantName.replace(/-([a-z0-9])/g, (_, c: string) =>
  c.toUpperCase(),
);
const pascal = camel.replace(/^[a-z]/, (c) => c.toUpperCase());
const snake = occupantName.replaceAll("-", "_");

// --- Questions --------------------------------------------------------------

const rl = createInterface({ input: stdin, output: stdout });
async function ask(
  flagName: string,
  question: string,
  fallback: string,
  valid: (answer: string) => string | null,
): Promise<string> {
  const given = flag(flagName);
  if (given !== undefined) {
    const problem = valid(given);
    if (problem) fail(`--${flagName} ${given}: ${problem}`);
    return given;
  }
  if (assumeDefaults) return fallback;
  for (;;) {
    const answer =
      (await rl.question(`${question}\n  [${fallback}] `)).trim() || fallback;
    const problem = valid(answer);
    if (!problem) return answer;
    console.log(`  ${problem}`);
  }
}
const oneOf = (options: string[]) => (answer: string) =>
  options.includes(answer) ? null : `Choose one of: ${options.join(", ")}.`;

const lucide: Record<string, unknown> = await import("lucide-react");

const label = await ask(
  "label",
  "What should people call it? It's shown in docs and occupant pickers.",
  pascal.replace(/([a-z])([A-Z])/g, "$1 $2"),
  (a) => (a.length > 0 ? null : "It needs a name."),
);
const icon = await ask(
  "icon",
  "Which lucide icon stands for it? Use its component name, like List or FileText.",
  "Square",
  (a) =>
    typeof lucide[a] === "object" || typeof lucide[a] === "function"
      ? null
      : `lucide-react has no ${a} icon.`,
);
const orientationsAnswer = await ask(
  "orientations",
  "What shape of space does it work in?\n" +
    "  vertical: a column that grows downward, like a side panel\n" +
    "  horizontal: a wide, short band, like a page header\n" +
    "  both: it shows the same information in either shape",
  "vertical",
  oneOf(["vertical", "horizontal", "both"]),
);
const minWidth = await ask(
  "min-width",
  "What's the narrowest width, in px, where it still works? Guess for now:\n" +
    "  the checks will measure the real floor across every example.",
  "240",
  (a) => (/^[1-9]\d*$/.test(a) ? null : "Use a whole number of px."),
);
const padding = await ask(
  "padding",
  "Does it sit inside the surface's padding (padded), or run edge to edge (flush)?",
  "padded",
  oneOf(["padded", "flush"]),
);
const scroll = await ask(
  "scroll",
  "When its content is taller than the space, who scrolls it?\n" +
    "  surface: the surface scrolls it (most occupants)\n" +
    "  occupant: it scrolls itself, like a table with a sticky header\n" +
    "  either: whichever the surface supports",
  "surface",
  oneOf(["surface", "occupant", "either"]),
);
const surfacesAnswer = await ask(
  "surfaces",
  "Is it built from one surface's own parts, so it only works there?\n" +
    "  Name that surface (page-header, side-panel, content-area), or answer none.",
  "none",
  oneOf(["none", "page-header", "side-panel", "content-area"]),
);
rl.close();

const orientations =
  orientationsAnswer === "both"
    ? ["vertical", "horizontal"]
    : [orientationsAnswer];
const surfaces = surfacesAnswer === "none" ? null : [surfacesAnswer];
const horizontalOnly = orientationsAnswer === "horizontal";
const demoSurface =
  surfaces?.[0] ?? (horizontalOnly ? "page-header" : "side-panel");

// --- Files ------------------------------------------------------------------

const files: Record<string, string> = {};

files[`registry/${occupantName}/${occupantName}.occupant.ts`] =
  `import { ${icon} } from "lucide-react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The ${label.toLowerCase()} spec. It describes the space it needs from a
 * surface, never a template.
 */
export const ${camel}Occupant = {
  name: "${occupantName}",
  label: "${label}",
  icon: ${icon},
  orientations: ${JSON.stringify(orientations)},
${surfaces ? `  // Built from ${surfaces[0]}'s own parts, so it only works there.\n  surfaces: ${JSON.stringify(surfaces)},\n` : ""}  // Measure the floor with the occupant checks, then set this at or above it.
  requires: { minWidth: ${minWidth}, padding: "${padding}", scroll: "${scroll}" },
} as const satisfies OccupantSpec;
`;

files[`registry/${occupantName}/${occupantName}.view-model.ts`] = `/**
 * The neutral view model for the ${label.toLowerCase()}: the shape of its
 * content, with no domain terms. A solution's adapter maps its own data into
 * it; the occupant never sees the domain.
 *
 * This is a starting stub: a list of items. Replace it with the real shape.
 */

export interface ${pascal}Item {
  id: string;
  title: string;
  /** Optional: occupants handle missing values. */
  detail?: string;
}

export interface ${pascal}ViewModel {
  /** What this is about, for accessible names, like an item's id. */
  subject: string;
  items: ${pascal}Item[];
}
`;

const layout =
  orientations.length > 1
    ? `cn(
            "flex min-w-0 gap-3",
            orientation === "horizontal" ? "flex-wrap items-center" : "flex-col",
          )`
    : `"flex min-w-0 ${horizontalOnly ? "flex-wrap items-center" : "flex-col"} gap-3"`;

files[`registry/${occupantName}/${occupantName}.tsx`] =
  `import { useTranslation } from "react-i18next";
import { Occupant, OccupantStateView, type OccupantViewProps } from "@/components/ui/occupant";
${orientations.length > 1 ? 'import { useSurface } from "@/lib/surface-context";\nimport { cn } from "@/lib/utils";\n' : ""}import { ${camel}Occupant } from "./${occupantName}.occupant";
import type { ${pascal}ViewModel } from "./${occupantName}.view-model";

type ${pascal}Props = OccupantViewProps<${pascal}ViewModel>;

/** Occupant: ${label}. Describe what it shows. */
function ${pascal}({ view, state = "ready", onRetry }: ${pascal}Props) {
  const { t } = useTranslation();
${orientations.length > 1 ? "  // Adapt to the shape of the space, never to the surface's name.\n  const { orientation } = useSurface();\n" : ""}  // Nothing to show is the empty state.
  const shown = state === "ready" && view.items.length === 0 ? "empty" : state;
  return (
    <Occupant spec={${camel}Occupant}>
      <OccupantStateView
        state={shown}
        subject={t("${snake}_subject")}
        emptyDescription={t("${snake}_empty")}
        onRetry={onRetry}
      >
        <ul
          aria-label={t("${snake}_label", { subject: view.subject })}
          className={${layout}}
        >
          {view.items.map((item) => (
            <li key={item.id} className="min-w-0 wrap-anywhere">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
            </li>
          ))}
        </ul>
      </OccupantStateView>
    </Occupant>
  );
}

export { ${pascal}, ${camel}Occupant };
export type { ${pascal}Props };
`;

files[`registry/${occupantName}/examples/example.example-adapter.ts`] = `/**
 * EXAMPLE ADAPTER. Not shipped: it shows how a solution maps its own data
 * into the ${label.toLowerCase()} view model. Adapters belong to solutions.
 * Replace SourceRecord with a real shape, and add an adapter from a second
 * domain, so the occupant is shown to work with either.
 */
import type { ${pascal}ViewModel } from "../${occupantName}.view-model";

interface SourceRecord {
  reference: string;
  entries: { key: string; name: string; note?: string }[];
}

export function toViewModel(record: SourceRecord): ${pascal}ViewModel {
  return {
    subject: record.reference,
    items: record.entries.map((entry) => ({
      id: entry.key,
      title: entry.name,
      ...(entry.note && { detail: entry.note }),
    })),
  };
}

const SAMPLE: SourceRecord = {
  reference: "REF-1001",
  entries: [
    { key: "e1", name: "First entry", note: "A short note about it." },
    { key: "e2", name: "Second entry" },
    { key: "e3", name: "Third entry", note: "Another note." },
  ],
};

export const EXAMPLE = toViewModel(SAMPLE);
`;

files[`registry/${occupantName}/examples/stress.example-adapter.ts`] = `/**
 * EXAMPLE ADAPTER (stress). Not shipped, and not a real domain: the data
 * that breaks layouts, so the occupant checks prove it holds for any data.
 * Long titles, long unbroken tokens, many items, and missing or empty
 * optional values. Keep it in step with the view model.
 */
import type { ${pascal}ViewModel } from "../${occupantName}.view-model";

const UNBROKEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";

export const STRESS: ${pascal}ViewModel = {
  subject: \`REF-\${UNBROKEN}\`,
  items: Array.from({ length: 30 }, (_, i) => ({
    id: \`s\${i}\`,
    title: i % 2 ? \`\${LONG} \${i}\` : \`\${UNBROKEN}\${i}\`,
    // Missing and empty details.
    ...(i % 3 === 0 ? {} : { detail: i % 3 === 1 ? LONG : "" }),
  })),
};
`;

files[`registry/${occupantName}/examples/index.ts`] = `/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * this occupant with, keyed by example name. "stress" is required.
 */
import type { ${pascal}ViewModel } from "../${occupantName}.view-model";
import { EXAMPLE } from "./example.example-adapter";
import { STRESS } from "./stress.example-adapter";

export const EXAMPLES: Record<string, ${pascal}ViewModel> = {
  example: EXAMPLE,
  stress: STRESS,
};
`;

const title = label.replace(/\b[a-z]/g, (c) => c.toUpperCase());
const docsPage = `app/patterns/${occupantName}/page.mdx`;
files[docsPage] =
  `import { OccupantLabel, WhereItFits } from '@/app/_components/occupant-docs';
import { OccupantInSurface } from '@/app/_components/occupant-in-surface';

# ${title}

<OccupantLabel />

Say what it shows, in one or two sentences. It takes the
[occupant](/guidelines/creating-occupants) role.

<div className="not-prose my-6">
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="example" width={${horizontalOnly ? '"100%"' : 360}} />
</div>

## Where it fits

<WhereItFits name="${occupantName}" />

## View model

Describe the fields of \`${pascal}ViewModel\`, and what a solution's adapter
maps into each.

## Installation

\`\`\`bash
npx shadcn@latest add @uipath/${occupantName}
\`\`\`

## Accessibility

Say how it's named and announced, and how long values behave.
`;

// --- Registration -----------------------------------------------------------

// registry.json: a new item after the last occupant item.
const registryJson = read("registry.json");
const lastOccupant = registryJson.lastIndexOf('"layer": "occupant"');
if (lastOccupant === -1)
  fail("registry.json has no occupant items to add after.");
const itemEnd =
  registryJson.indexOf("\n    }", lastOccupant) + "\n    }".length;
const item = `,
    {
      "name": "${occupantName}",
      "type": "registry:ui",
      "title": "${label}",
      "description": "Occupant: ${label.toLowerCase()}. Describe what it shows.",
      "dependencies": ["react-i18next"],
      "registryDependencies": ["@uipath/occupant"],
      "meta": { "layer": "occupant" },
      "categories": ["occupant"],
      "files": [
        { "path": "registry/${occupantName}/${occupantName}.tsx", "type": "registry:ui" },
        { "path": "registry/${occupantName}/${occupantName}.occupant.ts", "type": "registry:ui" },
        { "path": "registry/${occupantName}/${occupantName}.view-model.ts", "type": "registry:ui" }
      ]
    }`;
files["registry.json"] =
  registryJson.slice(0, itemEnd) + item + registryJson.slice(itemEnd);
JSON.parse(files["registry.json"]);

// tsconfig.json: the component's path alias, next to the occupant kit's.
const tsconfig = read("tsconfig.json");
const kitAlias = tsconfig.indexOf('"@/components/ui/occupant"');
if (kitAlias === -1)
  fail("tsconfig.json has no @/components/ui/occupant alias to add after.");
const kitLineEnd = tsconfig.indexOf("\n", kitAlias);
files["tsconfig.json"] =
  tsconfig.slice(0, kitLineEnd) +
  `\n      "@/components/ui/${occupantName}": ["./registry/${occupantName}/${occupantName}"],` +
  tsconfig.slice(kitLineEnd);

// The Patterns nav, in alphabetical order. Nothing existing moves.
const meta = read("app/patterns/_meta.ts");
const entryLines = meta.split("\n");
const keyOf = (line: string) => line.match(/^\s+"?([a-z0-9-]+)"?:/)?.[1];
const insertAt = entryLines.findIndex((line) => {
  const key = keyOf(line);
  return key !== undefined && key > occupantName;
});
const closing = entryLines.findIndex((line) => line.startsWith("}"));
entryLines.splice(
  insertAt === -1 ? closing : insertAt,
  0,
  `  "${occupantName}": "${title}",`,
);
files["app/patterns/_meta.ts"] = entryLines.join("\n");

// Copy in locales/en.json, each key in alphabetical position. Only English:
// the localization team syncs the other locales.
const en = read("locales/en.json").trimEnd().split("\n");
const body = en.slice(1, -1).map((line) => line.replace(/,$/, ""));
const newKeys: Record<string, string> = {
  [`${snake}_empty`]: "Items show here when there are some.",
  [`${snake}_label`]: `${label} for {{subject}}`,
  [`${snake}_subject`]: label.toLowerCase(),
};
for (const [key, value] of Object.entries(newKeys).sort()) {
  const line = `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`;
  const at = body.findIndex((l) => (l.match(/^\s+"([^"]+)"/)?.[1] ?? "") > key);
  body.splice(at === -1 ? body.length : at, 0, line);
}
files["locales/en.json"] = `{\n${body.join(",\n")}\n}\n`;
JSON.parse(files["locales/en.json"]);

for (const [path, content] of Object.entries(files)) write(path, content);

const biome = join(root, "node_modules/.bin/biome");
execFileSync(
  biome,
  [
    "format",
    "--write",
    `registry/${occupantName}`,
    "registry.json",
    "tsconfig.json",
    "app/patterns/_meta.ts",
  ],
  { cwd: root, stdio: "ignore" },
);
execFileSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--no-warnings",
    "scripts/generate-occupant-index.ts",
  ],
  {
    cwd: root,
    stdio: "inherit",
  },
);

console.log(`
Created the ${label.toLowerCase()} occupant:
${Object.keys(files)
  .filter(
    (f) =>
      f.startsWith("registry/") || f.startsWith("app/patterns/" + occupantName),
  )
  .map((f) => `  ${f}`)
  .join("\n")}
Registered it in registry.json, tsconfig.json, the Patterns nav, locales/en.json,
and the occupant index. Previews with occupant pickers, the occupant checks,
and the docs read the index, so there's nothing else to wire up.

Next:
  1. Replace the view model stub with the real shape, then update the
     component and both adapters to match. Keep the stress adapter hard.
  2. Add an adapter from a second domain to examples/.
  3. Run the occupant checks, and set minWidth from the measured floor:
       pnpm exec playwright test --project=core occupants -g "${occupantName}"
  4. Fill in ${docsPage}.

A new docs page won't show until the dev server's page list is rebuilt:
stop the dev server, run rm -rf .next/dev, and start it again.
`);
