/**
 * pnpm create:occupant <name> [flags]
 *
 * Creates an occupant around a neutral view model. It asks for anything not
 * given as a flag, in plain language. Pass everything to run it without
 * questions (the create-occupant skill does):
 *
 *   --label <text>              what people call it
 *   --description <sentence>    what it shows: the doc comment, the registry
 *                               description, and the docs page's opening
 *   --icon <LucideName>         its icon in pickers
 *   --orientations <vertical|horizontal|both>
 *   --min-width <px>            a first guess; measure:occupant finds the floor
 *   --padding <padded|flush>
 *   --scroll <surface|occupant|either>
 *   --surfaces <none|page-header|side-panel|content-area>
 *   --view-model <file.json>    the view model (see VIEW MODEL below)
 *   --subject <noun>            copy: what it shows, lowercase ("participants")
 *   --empty <sentence>          copy: the empty state's message
 *   --primary-domain <text>     the two domains its example adapters come from,
 *   --secondary-domain <text>   like "project management"
 *   --yes                       take the defaults for anything not given
 *
 * VIEW MODEL (JSON):
 *   {
 *     "item": "Participant",            the item type, PascalCase
 *     "collection": "participants",     the list's field name, camelCase
 *     "subject": "What the list is about, for accessible names.",
 *     "fields": [
 *       { "name": "name", "kind": "title", "description": "The person's name." },
 *       { "name": "role", "kind": "detail", "optional": true, "description": "..." }
 *     ]
 *   }
 *   Kinds decide how a field renders and how the stress adapter tests it:
 *     title   the item's main text; wraps
 *     label   a short single line; truncates, full text in a title
 *     value   the main text of a label and value pair; shows "Not set" when empty
 *     detail  secondary text; wraps
 *     meta    small text, like a time; wraps
 *
 * It writes, in registry/<name>/: the spec, the view model, the component
 * (wrapped in <Occupant>, with the standard states, reading useSurface() when
 * it claims both orientations), and in examples/ the primary and secondary
 * adapters (to fill in) and a complete stress adapter. It writes a Patterns
 * page, and registers the occupant: registry.json, a path alias, the
 * Patterns nav, its copy in locales/en.json, and the occupant index.
 *
 * Anything it can't know is marked with the placeholder token, which
 * `pnpm check:placeholders` (part of lint) refuses.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

// The placeholder token. Split so the scripts that define it don't contain it;
// check-placeholders.ts and create-occupant.ts define it the same way.
const PLACEHOLDER = ["@fill", "in"].join("-");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const write = (path: string, content: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};
const FILL = (what: string) => `${PLACEHOLDER} ${what}`;

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
if (existsSync(join(root, "registry", occupantName)))
  fail(`registry/${occupantName} already exists.`);

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
  valid: (answer: string) => string | null = () => null,
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
const description = await ask(
  "description",
  "In one sentence, what does it show? Describe the content, not a business.",
  FILL("what it shows, in one sentence."),
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
    "  pnpm measure:occupant finds the real floor across every example.",
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

// The view model: a JSON file, or fields typed in as name:kind[?].
const KINDS = ["title", "label", "value", "detail", "meta"] as const;
type Kind = (typeof KINDS)[number];
interface Field {
  name: string;
  kind: Kind;
  optional?: boolean;
  description: string;
}
interface ViewModelSpec {
  item: string;
  collection: string;
  subject: string;
  fields: Field[];
}
let viewModel: ViewModelSpec;
const viewModelFile = flag("view-model");
if (viewModelFile) {
  if (!existsSync(viewModelFile))
    fail(`--view-model: no file at ${viewModelFile}`);
  viewModel = JSON.parse(readFileSync(viewModelFile, "utf8"));
} else {
  const typed = await ask(
    "fields",
    "What does each item hold? List fields as name:kind, with ? when it's optional.\n" +
      "  Kinds: title (main text), label (short, one line), value (the value in a\n" +
      "  label and value pair), detail (secondary text), meta (small text, like a time).",
    "title:title, detail:detail?",
  );
  viewModel = {
    item: `${pascal}Item`,
    collection: "items",
    subject: "What this is about, for accessible names, like an item's id.",
    fields: typed.split(",").map((part) => {
      const [fieldName = "", kindAnswer = ""] = part.trim().split(":");
      const optional = kindAnswer.endsWith("?");
      return {
        name: fieldName,
        kind: kindAnswer.replace("?", "") as Kind,
        optional,
        description: FILL(`what ${fieldName} holds.`),
      };
    }),
  };
}
const identifier = /^[a-z][A-Za-z0-9]*$/;
if (!/^[A-Z][A-Za-z0-9]*$/.test(viewModel.item ?? ""))
  fail(`view model: "item" must be PascalCase, like Participant.`);
if (!identifier.test(viewModel.collection ?? ""))
  fail(`view model: "collection" must be camelCase, like participants.`);
if (!Array.isArray(viewModel.fields) || viewModel.fields.length === 0)
  fail("view model: it needs at least one field.");
for (const field of viewModel.fields) {
  if (!identifier.test(field.name) || field.name === "id")
    fail(
      `view model: "${field.name}" isn't a camelCase field name (id is added for you).`,
    );
  if (!KINDS.includes(field.kind))
    fail(
      `view model: ${field.name}'s kind "${field.kind}" isn't one of ${KINDS.join(", ")}.`,
    );
}

const subject = await ask(
  "subject",
  'What does it show, as a lowercase noun, for its messages? Like "participants".',
  label.toLowerCase(),
);
const emptyMessage = await ask(
  "empty",
  "What should the empty state say? One sentence about what will appear here.",
  FILL("the empty state's message."),
);
const primaryDomain = await ask(
  "primary-domain",
  'Name one domain its data could come from, like "project management".',
  FILL("the primary example's domain"),
);
const secondaryDomain = await ask(
  "secondary-domain",
  "Name a different domain, so the examples show it isn't tied to one.",
  FILL("the secondary example's domain"),
);
rl.close();

const orientations =
  orientationsAnswer === "both"
    ? ["vertical", "horizontal"]
    : [orientationsAnswer];
const surfaces = surfacesAnswer === "none" ? null : [surfacesAnswer];
const both = orientations.length > 1;
const horizontalOnly = orientationsAnswer === "horizontal";
const demoSurface =
  surfaces?.[0] ?? (horizontalOnly ? "page-header" : "side-panel");
const { item, collection, fields } = viewModel;
const orientationSentence = both
  ? "Vertical and horizontal surfaces."
  : horizontalOnly
    ? "Horizontal surfaces."
    : "Vertical surfaces.";

// --- Files ------------------------------------------------------------------

const files: Record<string, string> = {};
const comment = (text: string, indent = "") => `${indent}/** ${text} */`;

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
${surfaces ? `  // Built from ${surfaces[0]}'s own parts, so it only works there.\n  surfaces: ${JSON.stringify(surfaces)},\n` : ""}  // Set with pnpm measure:occupant: at or above the measured floor.
  requires: { minWidth: ${minWidth}, padding: "${padding}", scroll: "${scroll}" },
} as const satisfies OccupantSpec;
`;

files[`registry/${occupantName}/${occupantName}.view-model.ts`] = `/**
 * The neutral view model for the ${label.toLowerCase()}: ${description.replace(/\.$/, "").replace(/^[A-Z]/, (c) => c.toLowerCase())}.
 * No domain terms. A solution's adapter maps its own data into it; the
 * occupant never sees the domain.
 */

export interface ${item} {
  id: string;
${fields.map((f) => `${comment(f.description, "  ")}\n  ${f.name}${f.optional ? "?" : ""}: string;`).join("\n")}
}

export interface ${pascal}ViewModel {
${comment(viewModel.subject, "  ")}
  subject: string;
  ${collection}: ${item}[];
}
`;

const fieldMarkup = (f: Field) => {
  const v = `entry.${f.name}`;
  const wrap = (element: string) =>
    f.optional && f.kind !== "value" ? `{${v} && (\n${element}\n)}` : element;
  switch (f.kind) {
    case "title":
      return wrap(
        `<p className="text-sm font-medium text-foreground wrap-anywhere">{${v}}</p>`,
      );
    case "label":
      return wrap(
        `<p className="truncate text-xs text-muted-foreground" title={${v}}>{${v}}</p>`,
      );
    case "value":
      return `<p className={cn("text-sm wrap-anywhere", ${v}?.length ? "font-medium text-foreground" : "text-muted-foreground")}>
  {${v}?.length ? ${v} : t("occupant_not_set")}
</p>`;
    case "detail":
      return wrap(
        `<p className="text-xs text-muted-foreground wrap-anywhere">{${v}}</p>`,
      );
    case "meta":
      return wrap(
        `<p className="mt-1 text-xs text-muted-foreground wrap-anywhere">{${v}}</p>`,
      );
  }
};
const usesCn = both || fields.some((f) => f.kind === "value");
const verticalList = "flex min-w-0 flex-col gap-3";
const horizontalList =
  "grid min-w-0 grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-6 gap-y-2";
const listClass = both
  ? `cn(orientation === "horizontal" ? "${horizontalList}" : "${verticalList}")`
  : `"${horizontalOnly ? horizontalList : verticalList}"`;

files[`registry/${occupantName}/${occupantName}.tsx`] =
  `import { useTranslation } from "react-i18next";
import { Occupant, OccupantStateView, type OccupantViewProps } from "@/components/ui/occupant";
${both ? 'import { useSurface } from "@/lib/surface-context";\n' : ""}${usesCn ? 'import { cn } from "@/lib/utils";\n' : ""}import { ${camel}Occupant } from "./${occupantName}.occupant";
import type { ${pascal}ViewModel } from "./${occupantName}.view-model";

type ${pascal}Props = OccupantViewProps<${pascal}ViewModel>;

/** Occupant: ${description} */
function ${pascal}({ view, state = "ready", onRetry }: ${pascal}Props) {
  const { t } = useTranslation();
${both ? "  // Adapt to the shape of the space, never to the surface's name.\n  const { orientation } = useSurface();\n" : ""}  // Nothing to show is the empty state.
  const shown = state === "ready" && view.${collection}.length === 0 ? "empty" : state;
  return (
    <Occupant spec={${camel}Occupant}>
      <OccupantStateView
        state={shown}
        subject={t("${snake}_subject")}
        emptyDescription={t("${snake}_empty")}
        onRetry={onRetry}
      >
        <ul aria-label={t("${snake}_label", { subject: view.subject })} className={${listClass}}>
          {view.${collection}.map((entry) => (
            <li key={entry.id} className="flex min-w-0 flex-col">
${fields.map(fieldMarkup).join("\n")}
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

const adapter = (
  role: "primary" | "secondary",
  domain: string,
  constant: string,
) => `/**
 * EXAMPLE ADAPTER (${role}). Not shipped: it shows how a solution (${domain})
 * maps its own data into the ${label.toLowerCase()} view model. Adapters
 * belong to solutions.
 */
import type { ${pascal}ViewModel } from "../${occupantName}.view-model";

// ${FILL(`a record type from ${domain}, a function that maps it to ${pascal}ViewModel, and sample data.`)}
export const ${constant}: ${pascal}ViewModel = {
  subject: "${PLACEHOLDER}",
  ${collection}: [],
};
`;
files[`registry/${occupantName}/examples/primary.example-adapter.ts`] = adapter(
  "primary",
  primaryDomain,
  "PRIMARY",
);
files[`registry/${occupantName}/examples/secondary.example-adapter.ts`] =
  adapter("secondary", secondaryDomain, "SECONDARY");

const stressValue = (f: Field, i: string) => {
  switch (f.kind) {
    case "label":
      return `${i} % 2 ? \`A ${f.name} that runs long \${i}\` : \`\${UNBROKEN}\${i}\``;
    case "meta":
      return `${i} % 3 ? \`\${UNBROKEN.slice(0, 24)} \${i}\` : LONG`;
    default:
      return `${i} % 2 ? \`\${LONG} \${i}\` : \`\${UNBROKEN}\${i}\``;
  }
};
files[`registry/${occupantName}/examples/stress.example-adapter.ts`] = `/**
 * EXAMPLE ADAPTER (stress). Not shipped, and not a real domain: the data
 * that breaks layouts, so the occupant checks prove it holds for any data.
 * Long values, long unbroken tokens, many items, and missing or empty
 * optional values. Generated from the view model's fields.
 */
import type { ${pascal}ViewModel } from "../${occupantName}.view-model";

const UNBROKEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";

export const STRESS: ${pascal}ViewModel = {
  subject: \`REF-\${UNBROKEN}\`,
  ${collection}: Array.from({ length: 30 }, (_, i) => ({
    id: \`s\${i}\`,
${fields
  .map((f) =>
    f.optional
      ? `    // Missing every third item, empty every third.\n    ...(i % 3 === 0 ? {} : { ${f.name}: i % 3 === 1 ? ${stressValue(f, "i")} : "" }),`
      : `    ${f.name}: ${stressValue(f, "i")},`,
  )
  .join("\n")}
  })),
};
`;

files[`registry/${occupantName}/examples/index.ts`] = `/**
 * EXAMPLES. Not shipped: the view models the occupant checks and docs render
 * the ${label.toLowerCase()} with, by role. Primary is ${primaryDomain},
 * secondary ${secondaryDomain}, and stress the data that breaks layouts.
 */
import type { OccupantExamples } from "@/lib/occupant-entry";
import type { ${pascal}ViewModel } from "../${occupantName}.view-model";
import { PRIMARY } from "./primary.example-adapter";
import { SECONDARY } from "./secondary.example-adapter";
import { STRESS } from "./stress.example-adapter";

export const EXAMPLES: OccupantExamples<${pascal}ViewModel> = {
  primary: PRIMARY,
  secondary: SECONDARY,
  stress: STRESS,
};
`;

const title = label.replace(/\b[a-z]/g, (c) => c.toUpperCase());
const docsPage = `app/patterns/${occupantName}/page.mdx`;
const demos = horizontalOnly
  ? `<div className="not-prose my-6 flex flex-col gap-6">
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="primary" width="100%" />
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="secondary" width="100%" />
</div>`
  : `<div className="not-prose my-6 flex flex-wrap gap-6">
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="primary" width={320} height="auto" />
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="secondary" width={320} height="auto" />
</div>`;
const a11y = [
  `- The ${subject} are a list, named for the subject ("${label} for …").`,
  fields.some((f) => f.kind === "label") &&
    "- Short labels truncate, with the full text in a title.",
  "- Everything else wraps, so nothing is cut off at any width from the minimum up.",
  fields.some((f) => f.kind === "value") &&
    '- A missing or empty value shows as "Not set".',
]
  .filter(Boolean)
  .join("\n");
files[docsPage] =
  `import { OccupantLabel, WhereItFits } from '@/app/_components/occupant-docs';
import { OccupantInSurface } from '@/app/_components/occupant-in-surface';

# ${title}

<OccupantLabel />

${description} It takes the [occupant](/guidelines/creating-occupants) role.

${demos}

The same occupant, with data from ${primaryDomain} and ${secondaryDomain}.
Neither is built into it.

## Where it fits

<WhereItFits name="${occupantName}" />

## View model

It renders a \`${pascal}ViewModel\`. Nothing in it names a domain.

| Field | What it holds |
| --- | --- |
| \`subject\` | ${viewModel.subject} |
| \`${collection}\` | Each item's \`id\`, and: ${fields.map((f) => `\`${f.name}\`${f.optional ? " (optional)" : ""}`).join(", ")} |
${fields.map((f) => `| \`${f.name}\` | ${f.description} |`).join("\n")}

Your solution maps its own data into this shape with an adapter. The adapter
belongs to your solution, not to the occupant.

## States

It renders the standard occupant states. With no ${subject}, it shows the empty
state.

## Installation

\`\`\`bash
npx shadcn@latest add @uipath/${occupantName}
\`\`\`

## Accessibility

${a11y}
`;

// --- Registration -----------------------------------------------------------

const registryJson = read("registry.json");
const lastOccupant = registryJson.lastIndexOf('"layer": "occupant"');
if (lastOccupant === -1)
  fail("registry.json has no occupant items to add after.");
const itemEnd =
  registryJson.indexOf("\n    }", lastOccupant) + "\n    }".length;
const registryItem = `,
    {
      "name": "${occupantName}",
      "type": "registry:ui",
      "title": "${label}",
      "description": ${JSON.stringify(`Occupant: ${description.replace(/\.$/, "").replace(/^[A-Z]/, (c) => c.toLowerCase())}. ${orientationSentence}`)},
      "dependencies": ["lucide-react", "react-i18next"],
      "registryDependencies": ["@uipath/composition", "@uipath/occupant"],
      "meta": { "layer": "occupant" },
      "categories": ["occupant"],
      "files": [
        { "path": "registry/${occupantName}/${occupantName}.tsx", "type": "registry:ui" },
        { "path": "registry/${occupantName}/${occupantName}.occupant.ts", "type": "registry:ui" },
        { "path": "registry/${occupantName}/${occupantName}.view-model.ts", "type": "registry:ui" }
      ]
    }`;
files["registry.json"] =
  registryJson.slice(0, itemEnd) + registryItem + registryJson.slice(itemEnd);
JSON.parse(files["registry.json"]);

const tsconfig = read("tsconfig.json");
const kitAlias = tsconfig.indexOf('"@/components/ui/occupant"');
if (kitAlias === -1)
  fail("tsconfig.json has no @/components/ui/occupant alias to add after.");
const kitLineEnd = tsconfig.indexOf("\n", kitAlias);
files["tsconfig.json"] =
  tsconfig.slice(0, kitLineEnd) +
  `\n      "@/components/ui/${occupantName}": ["./registry/${occupantName}/${occupantName}"],` +
  tsconfig.slice(kitLineEnd);

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

// Copy in locales/en.json, each key in alphabetical position. English only:
// the localization team syncs the other locales.
const en = read("locales/en.json").trimEnd().split("\n");
const body = en.slice(1, -1).map((line) => line.replace(/,$/, ""));
const newKeys: Record<string, string> = {
  [`${snake}_empty`]: emptyMessage,
  [`${snake}_label`]: `${label} for {{subject}}`,
  [`${snake}_subject`]: subject,
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

const unfilled = Object.entries(files)
  .filter(([, content]) => content.includes(PLACEHOLDER))
  .map(([path]) => `  ${path}`);

console.log(`
Created the ${label.toLowerCase()} occupant in registry/${occupantName}/, with its
Patterns page at ${docsPage}. Registered it in registry.json, tsconfig.json,
the Patterns nav, locales/en.json, and the occupant index. Previews with
occupant pickers, the occupant checks, and the docs read the index.
${
  unfilled.length
    ? `
Still to fill in (marked ${PLACEHOLDER}; lint fails until they're gone):
${unfilled.join("\n")}`
    : ""
}
Next:
  1. Fill in anything above, including both example adapters: real-looking
     data from ${primaryDomain} and ${secondaryDomain}.
  2. Measure the floor, and set minWidth:
       pnpm measure:occupant ${occupantName}
       pnpm measure:occupant ${occupantName} --apply
       pnpm measure:occupant ${occupantName} --set <px> --reason "<why it's wider>"
  3. Run the occupant checks:
       pnpm exec playwright test --project=core occupants -g "${occupantName}"

A new docs page won't show until the dev server's page list is rebuilt:
stop the dev server, run rm -rf .next/dev, and start it again.
`);
