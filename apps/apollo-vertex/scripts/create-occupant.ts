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
 *   --min-width <px|follow>     a first guess; measure:occupant finds the floor.
 *                               "follow" tracks the narrowest surface it claims
 *   --padding <padded|flush>
 *   --scroll <surface|occupant|either>
 *   --surfaces <none|list>      the surfaces it belongs in, when not every
 *                               surface of its orientations: a comma list of
 *                               page-header, side-panel, content-area
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
 *     ],
 *     "selectable": true,   optional: cards people pick, with previous and next
 *     "groups": true,       optional: items grouped under labels, with counts
 *     "filters": true       optional: tabs that filter the items, with "All"
 *   }
 *   Kinds decide how a field renders and how the stress adapter tests it:
 *     title   the item's main text; wraps (on a card: one line, truncated,
 *             with the full title in a tooltip)
 *     label   a short single line; truncates, full text in a title
 *     value   the main text of a label and value pair; shows "Not set" when empty
 *     detail  secondary text; wraps
 *     meta    small text, like a time; wraps
 *     figure  a prominent value, like an amount; at the end of the title's line
 *     status  a label with a tone (a colored dot), and a count of any more
 *
 *   Selectable items render as cards: the page owns the current item
 *   (currentId, onSelect), and a footer steps through the visible items.
 *   Selectable or filtered occupants scroll themselves, so the tabs and the
 *   footer stay put: scroll is "occupant". They're vertical only.
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
  (a) =>
    /^[1-9]\d*$/.test(a) || a === "follow"
      ? null
      : 'Use a whole number of px, or "follow" to track the surface.',
);
const padding = await ask(
  "padding",
  "Does it sit inside the surface's padding (padded), or run edge to edge (flush)?",
  "padded",
  oneOf(["padded", "flush"]),
);
const scrollAnswer = await ask(
  "scroll",
  "When its content is taller than the space, who scrolls it?\n" +
    "  surface: the surface scrolls it (most occupants)\n" +
    "  occupant: it scrolls itself, like a table with a sticky header\n" +
    "  either: whichever the surface supports",
  "surface",
  oneOf(["surface", "occupant", "either"]),
);
const SURFACE_NAMES = ["page-header", "side-panel", "content-area"];
const surfacesAnswer = await ask(
  "surfaces",
  "Does it belong in only some surfaces of its shape? List them, comma separated\n" +
    "  (page-header, side-panel, content-area), or answer none for all of them.",
  "none",
  (a) =>
    a === "none" ||
    a.split(",").every((name) => SURFACE_NAMES.includes(name.trim()))
      ? null
      : `Answer none, or list some of: ${SURFACE_NAMES.join(", ")}.`,
);
const surfaces =
  surfacesAnswer === "none"
    ? null
    : surfacesAnswer.split(",").map((name) => name.trim());

// The view model: a JSON file, or fields typed in as name:kind[?].
const KINDS = [
  "title",
  "label",
  "value",
  "detail",
  "meta",
  "figure",
  "status",
] as const;
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
  selectable?: boolean;
  groups?: boolean;
  filters?: boolean;
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
  if (["group", "filter", "subject"].includes(field.name))
    fail(
      `view model: "${field.name}" is reserved (groups and filters add group and filter).`,
    );
}
const selectable = viewModel.selectable === true;
const grouped = viewModel.groups === true;
const filtered = viewModel.filters === true;
// Tabs and the footer stay put, so the occupant scrolls its own list.
const ownScroll = selectable || filtered;
if (ownScroll && orientationsAnswer !== "vertical")
  fail("selectable and filtered occupants are vertical only.");
if (ownScroll && flag("scroll") !== undefined && scrollAnswer !== "occupant")
  fail(
    '--scroll: selectable and filtered occupants scroll themselves, so the tabs and footer stay put. Use "occupant".',
  );
const scroll = ownScroll ? "occupant" : scrollAnswer;

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

// "follow": the narrowest vertical surface it claims, from its width token,
// so the minimum moves with the token. Flush gets the surface's full width.
const FOLLOW_TOKEN: Record<string, string> = {
  "side-panel": "sidePanelWidthMin",
  "content-area": "contentAreaWidthMin",
};
const follows = minWidth === "follow";
// The narrowest vertical surface it belongs in.
const followed =
  ["side-panel", "content-area"].find(
    (name) => !surfaces || surfaces.includes(name),
  ) ?? "page-header";
if (follows && (orientationsAnswer !== "vertical" || !FOLLOW_TOKEN[followed]))
  fail(
    "--min-width follow: only a vertical occupant can follow its surface; the page header promises no width.",
  );
const followLabel = followed.replace("-", " ");
const minWidthSource = follows
  ? `LAYOUT_TOKENS.${FOLLOW_TOKEN[followed]}${padding === "padded" ? " - 2 * PADDED_INSET_PX" : ""}`
  : minWidth;

const orientations =
  orientationsAnswer === "both"
    ? ["vertical", "horizontal"]
    : [orientationsAnswer];
const both = orientations.length > 1;
const horizontalOnly = orientationsAnswer === "horizontal";
const demoSurface = horizontalOnly
  ? "page-header"
  : (surfaces?.find((name) => name !== "page-header") ?? "side-panel");
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
${follows ? `import { LAYOUT_TOKENS, type OccupantSpec${padding === "padded" ? ", PADDED_INSET_PX" : ""} } from "@/lib/composition";` : 'import type { OccupantSpec } from "@/lib/composition";'}

/**
 * The ${label.toLowerCase()} spec. It describes the space it needs from a
 * surface, never a template.
 */
export const ${camel}Occupant = {
  name: "${occupantName}",
  label: "${label}",
  icon: ${icon},
  orientations: ${JSON.stringify(orientations)},
${surfaces ? `  // It belongs in these surfaces only.\n  surfaces: ${JSON.stringify(surfaces)},\n` : ""}${
  follows
    ? `  // Follows the ${followLabel}'s minimum width${padding === "padded" ? ", less its padding" : ""}, so it fits any
  // ${followLabel}. pnpm measure:occupant checks nothing clips there.\n`
    : "  // Set with pnpm measure:occupant: at or above the measured floor.\n"
}  requires: { minWidth: ${minWidthSource}, padding: "${padding}", scroll: "${scroll}" },
} as const satisfies OccupantSpec;
`;

const hasStatus = fields.some((f) => f.kind === "status");
const fieldType = (f: Field) =>
  f.kind === "status" ? "OccupantStatusValue" : "string";
files[`registry/${occupantName}/${occupantName}.view-model.ts`] = `/**
 * The neutral view model for the ${label.toLowerCase()}: ${description.replace(/\.$/, "").replace(/^[A-Z]/, (c) => c.toLowerCase())}.
 * No domain terms. A solution's adapter maps its own data into it; the
 * occupant never sees the domain.
 */
${hasStatus ? '\nimport type { OccupantStatusValue } from "@/components/ui/occupant";\n' : ""}
export interface ${item} {
  id: string;
${fields.map((f) => `${comment(f.description, "  ")}\n  ${f.name}${f.optional ? "?" : ""}: ${fieldType(f)};`).join("\n")}
${grouped ? `${comment("The label it's grouped under. Groups show in the order they first appear.", "  ")}\n  group: string;\n` : ""}${filtered ? `${comment("The id of the filter it belongs to, from filters.", "  ")}\n  filter: string;\n` : ""}}
${filtered ? `\nexport interface ${pascal}Filter {\n  id: string;\n  label: string;\n}\n` : ""}
export interface ${pascal}ViewModel {
${comment(viewModel.subject, "  ")}
  subject: string;
${filtered ? `${comment('The tabs that filter the items, in order. "All" comes first on its own.', "  ")}\n  filters: ${pascal}Filter[];\n` : ""}  ${collection}: ${item}[];
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
    case "figure":
      return wrap(
        `<p className="text-sm font-semibold text-foreground tabular-nums wrap-anywhere">{${v}}</p>`,
      );
    case "status":
      return wrap(`<OccupantStatus status={${v}} />`);
  }
};

// Cards: the title's line (titles, then figures at its end), the status line
// (statuses, then labels at its end), then any details and meta. What sits
// at a line's end takes up to half of it, so every card lays out the same
// way at a width: a long figure wraps there, and a long label truncates.
// Titles stay on one line, truncated, with the full title in a tooltip.
// Titles are text-sm; everything else in a card is text-xs.
const cardMarkup = () => {
  const of = (...kinds: Kind[]) => fields.filter((f) => kinds.includes(f.kind));
  const optional = (f: Field, element: string) =>
    f.optional ? `{entry.${f.name} && (\n${element}\n)}` : element;
  const line = (items: string[], className: string) =>
    items.length
      ? `<div className="flex min-w-0 items-baseline justify-between ${className}">\n${items.join("\n")}\n</div>`
      : "";
  const first = [
    ...of("title").map((f) =>
      optional(
        f,
        `<OccupantTruncatedText className="flex-1 text-sm font-semibold text-foreground">{entry.${f.name}}</OccupantTruncatedText>`,
      ),
    ),
    ...of("figure").map((f) =>
      optional(
        f,
        `<p className="max-w-1/2 shrink-0 text-end text-xs font-semibold text-foreground tabular-nums wrap-anywhere">{entry.${f.name}}</p>`,
      ),
    ),
  ];
  const second = [
    ...of("status").map((f) =>
      optional(
        f,
        `<OccupantStatus status={entry.${f.name}} className="flex-1 text-xs" />`,
      ),
    ),
    ...of("label").map((f) =>
      optional(
        f,
        `<p className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground" title={entry.${f.name}}>{entry.${f.name}}</p>`,
      ),
    ),
  ];
  const rest = of("value", "detail", "meta").map(fieldMarkup);
  // 32px between a title and what's to its right.
  return [line(first, "gap-8"), line(second, "mt-2 gap-3"), ...rest]
    .filter(Boolean)
    .join("\n");
};
const usesCn = both || fields.some((f) => f.kind === "value");
const verticalList = "flex min-w-0 flex-col gap-3";
const horizontalList =
  "grid min-w-0 grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-6 gap-y-2";
const listClass = both
  ? `cn(orientation === "horizontal" ? "${horizontalList}" : "${verticalList}")`
  : `"${horizontalOnly ? horizontalList : verticalList}"`;

const listItems = (items: string) =>
  selectable
    ? `{${items}.map((entry) => (
  <li key={entry.id}>
    <Card
      selectable="standard"
      selected={entry.id === currentId}
      className="rounded-md"
      onClick={() => onSelect?.(entry.id)}
      // Keep the current item in view as people step through.
      ref={entry.id === currentId ? revealCurrent : null}
    >
${cardMarkup()}
    </Card>
  </li>
))}`
    : `{${items}.map((entry) => (
  <li key={entry.id} className="flex min-w-0 flex-col">
${fields.map(fieldMarkup).join("\n")}
  </li>
))}`;
// Flush occupants pad their own parts with the surface inset.
const inset = padding === "flush" ? " px-(--surface-inset)" : "";
const listAria = `aria-label={t("${snake}_label", { subject: view.subject })}`;
const groupsMarkup = `{groups.map((group, index) => (
  <div key={group.label} role="group" aria-labelledby={\`\${groupId}-\${index}\`} className="flex min-w-0 flex-col gap-3">
    <p id={\`\${groupId}-\${index}\`} className="text-xs text-muted-foreground wrap-anywhere">
      {t("occupant_group", { label: group.label, count: group.items.length })}
    </p>
    <ul className="flex min-w-0 flex-col gap-3">
${listItems("group.items")}
    </ul>
  </div>
))}`;
const itemsMarkup = grouped
  ? `<div ${listAria} role="group" className="flex min-w-0 flex-col gap-6">\n${groupsMarkup}\n</div>`
  : `<ul ${listAria} className={${listClass}}>\n${listItems("visible")}\n</ul>`;
const noMatch = filtered
  ? `{visible.length === 0 && (
  <p className="py-6 text-center text-sm text-muted-foreground wrap-anywhere">
    {t("occupant_none_match", { subject: t("${snake}_subject") })}
  </p>
)}`
  : "";
const scrollList = (element: string, inner: string) =>
  `<${element}
  ref={listRef}
  className={cn("min-h-0 flex-1 overflow-y-auto outline-none${inset} py-4", SCROLL_FADE_MASK)}
>
${inner}
</${element.split(" ")[0]}>`;
const listBody = `${noMatch}\n${itemsMarkup}`;
const tabsMarkup = `<div
  ref={tabsRef}
  data-scroll-x
  className={cn("shrink-0 overflow-x-auto${inset} pt-(--surface-inset) pb-2", SCROLL_FADE_MASK_X)}
>
  {/* As wide as the list, or its content when that's wider; spare space is shared evenly. */}
  <TabsList className="w-full min-w-max" aria-label={t("occupant_filter", { subject: t("${snake}_subject") })}>
    {[{ id: ALL, label: t("all") }, ...view.filters].map((option) => (
      <TabsTrigger key={option.id} value={option.id} className="flex-auto">
        {option.label}
        {option.id === filter && (
          <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
            {visible.length}
          </span>
        )}
      </TabsTrigger>
    ))}
  </TabsList>
</div>`;
const pagerMarkup = `<div className="flex shrink-0 items-center justify-between gap-2 border-t border-border${inset} py-2">
  <Button
    variant="ghost"
    size="icon"
    aria-label={t("occupant_previous_item")}
    disabled={position <= 0}
    onClick={() => step(position - 1)}
  >
    <ChevronLeft aria-hidden />
  </Button>
  <p aria-live="polite" className="min-w-0 text-center text-sm text-muted-foreground wrap-anywhere">
    {position === -1
      ? t("occupant_count", { count: ordered.length })
      : t("occupant_position", { position: position + 1, count: ordered.length })}
  </p>
  <Button
    variant="ghost"
    size="icon"
    aria-label={t("occupant_next_item")}
    disabled={position === ordered.length - 1}
    onClick={() => step(position + 1)}
  >
    <ChevronRight aria-hidden />
  </Button>
</div>`;
// The ready view: the list alone, or tabs, a scrolling list, and the footer.
const readyMarkup = ownScroll
  ? filtered
    ? `<Tabs
  value={filter}
  onValueChange={setFilter}
  // A mask hides focus rings, so the list's ring is drawn here.
  className="min-h-0 flex-1 gap-0 rounded-lg has-[[data-slot=tabs-content]:focus-visible]:ring-2 has-[[data-slot=tabs-content]:focus-visible]:ring-ring/50 has-[[data-slot=tabs-content]:focus-visible]:ring-inset"
>
${tabsMarkup}
${scrollList("TabsContent value={filter}", listBody)}
${selectable ? pagerMarkup : ""}
</Tabs>`
    : `<div className="flex min-h-0 flex-1 flex-col rounded-lg has-[[data-scroll-list]:focus-visible]:ring-2 has-[[data-scroll-list]:focus-visible]:ring-ring/50 has-[[data-scroll-list]:focus-visible]:ring-inset">
${scrollList("div data-scroll-list", listBody)}
${pagerMarkup}
</div>`
  : itemsMarkup;

const reactNames = [grouped && "useId", filtered && "useState"].filter(Boolean);
const imports = [
  reactNames.length > 0 && `import { ${reactNames.join(", ")} } from "react";`,
  selectable && 'import { ChevronLeft, ChevronRight } from "lucide-react";',
  'import { useTranslation } from "react-i18next";',
  selectable && 'import { Button } from "@/components/ui/button";',
  selectable && 'import { Card } from "@/components/ui/card";',
  `import { Occupant, ${hasStatus ? "OccupantStatus, " : ""}OccupantStateView, ${selectable && fields.some((f) => f.kind === "title") ? "OccupantTruncatedText, " : ""} type OccupantViewProps${selectable ? ", type OccupantSelectionProps" : ""} } from "@/components/ui/occupant";`,
  filtered &&
    'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";',
  ownScroll &&
    `import { SCROLL_FADE_MASK, ${filtered ? "SCROLL_FADE_MASK_X, " : ""}useScrollFade } from "@/hooks/use-scroll-fade";`,
  both && 'import { useSurface } from "@/lib/surface-context";',
  (usesCn || ownScroll) && 'import { cn } from "@/lib/utils";',
  `import { ${camel}Occupant } from "./${occupantName}.occupant";`,
  `import type { ${pascal}ViewModel } from "./${occupantName}.view-model";`,
].filter((line): line is string => typeof line === "string");

const componentBody = [
  both &&
    "  // Adapt to the shape of the space, never to the surface's name.\n  const { orientation } = useSurface();",
  filtered &&
    `  // Filtering happens here, so the tab counts always match what's shown.
  const [filter, setFilter] = useState(ALL);
  const visible = filter === ALL ? view.${collection} : view.${collection}.filter((entry) => entry.filter === filter);`,
  !filtered && `  const visible = view.${collection};`,
  grouped &&
    `  const groupId = useId();
  // Groups in the order they first appear, each with its visible items.
  const groups: { label: string; items: typeof visible }[] = [];
  for (const entry of visible) {
    const group = groups.find((g) => g.label === entry.group);
    if (group) group.items.push(entry);
    else groups.push({ label: entry.group, items: [entry] });
  }`,
  selectable &&
    `  // Stepping follows the order on screen: group by group.
  const ordered = ${grouped ? "groups.flatMap((group) => group.items)" : "visible"};
  const position = ordered.findIndex((entry) => entry.id === currentId);
  const step = (index: number) => {
    const next = ordered[index];
    if (next) onSelect?.(next.id);
  };`,
  ownScroll &&
    `  const listRef = useScrollFade<HTMLDivElement>();${filtered ? '\n  const tabsRef = useScrollFade<HTMLDivElement>(true, null, { axis: "x" });' : ""}`,
  `  // Nothing to show is the empty state.
  const shown = state === "ready" && view.${collection}.length === 0 ? "empty" : state;`,
]
  .filter(Boolean)
  .join("\n");

files[`registry/${occupantName}/${occupantName}.tsx`] = `${imports.join("\n")}

${filtered ? 'const ALL = "all";\n\n' : ""}${
  selectable
    ? `const revealCurrent = (node: HTMLElement | null) =>
  node?.scrollIntoView({ block: "nearest" });

`
    : ""
}type ${pascal}Props = OccupantViewProps<${pascal}ViewModel>${selectable ? " & OccupantSelectionProps" : ""};

/** Occupant: ${description} */
function ${pascal}({ view, state = "ready", onRetry${selectable ? ", currentId, onSelect" : ""} }: ${pascal}Props) {
  const { t } = useTranslation();
${componentBody}
  return (
    <Occupant spec={${camel}Occupant}>
      <OccupantStateView
        state={shown}
        subject={t("${snake}_subject")}
        emptyDescription={t("${snake}_empty")}
        onRetry={onRetry}${padding === "flush" && ownScroll ? "\n        flush" : ""}
      >
${readyMarkup}
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
${filtered ? "  filters: [],\n" : ""}  ${collection}: [],
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
    case "status":
      return `{ label: ${i} % 2 ? \`\${LONG} \${${i}}\` : \`\${UNBROKEN}\${${i}}\`, tone: TONES[${i} % TONES.length] ?? "neutral", ...(${i} % 4 === 1 ? { more: 12 } : {}) }`;
    case "figure":
      return `${i} % 5 ? \`\${UNBROKEN.slice(0, 18)}\${${i}}\` : LONG`;
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
${hasStatus ? 'import type { OccupantTone } from "@/components/ui/occupant";\n' : ""}import type { ${pascal}ViewModel } from "../${occupantName}.view-model";

const UNBROKEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";${
  hasStatus
    ? '\nconst TONES: OccupantTone[] = ["neutral", "info", "success", "warning", "error"];'
    : ""
}
const LONG =
  "A very long value that keeps going well past any width a narrow slot can give it, to test wrapping";

export const STRESS: ${pascal}ViewModel = {
  subject: \`REF-\${UNBROKEN}\`,${
    filtered
      ? `
  // Many filters, with long labels and one no item belongs to.
  filters: Array.from({ length: 8 }, (_, i) => ({
    id: \`f\${i}\`,
    label: i % 2 ? \`\${LONG.slice(0, 40)} \${i}\` : \`\${UNBROKEN.slice(0, 20)}\${i}\`,
  })),`
      : ""
  }
  ${collection}: Array.from({ length: 30 }, (_, i) => ({
    id: \`s\${i}\`,${grouped ? "\n    // Long and unbroken group labels.\n    group: i < 10 ? \`\${LONG} \${Math.floor(i / 5)}\` : \`\${UNBROKEN}\${Math.floor(i / 10)}\`," : ""}${filtered ? "\n    filter: \`f\${i % 7}\`," : ""}
${fields
  .map((f) =>
    f.optional
      ? f.kind === "status"
        ? `    // Missing every third item.\n    ...(i % 3 === 0 ? {} : { ${f.name}: ${stressValue(f, "i")} }),`
        : `    // Missing every third item, empty every third.\n    ...(i % 3 === 0 ? {} : { ${f.name}: i % 3 === 1 ? ${stressValue(f, "i")} : "" }),`
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

// Sentence case: only the first word starts with a capital.
const title = label.replace(/^[a-z]/, (c) => c.toUpperCase());
const docsPage = `app/patterns/${occupantName}/page.mdx`;
// A content area is never as narrow as a side panel: its demos take the page's width.
const demoWidth =
  demoSurface === "content-area" ? '"100%"' : `{${ownScroll ? 360 : 320}}`;
const demos = horizontalOnly
  ? `<div className="not-prose my-6 flex flex-col gap-6">
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="primary" width="100%" />
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="secondary" width="100%" />
</div>`
  : // An occupant that scrolls itself needs a height to scroll in.
    `<div className="not-prose my-6 flex flex-wrap gap-6">
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="primary" width=${demoWidth} height=${ownScroll ? "{560}" : '"auto"'} />
  <OccupantInSurface occupant="${occupantName}" surface="${demoSurface}" example="secondary" width=${demoWidth} height=${ownScroll ? "{560}" : '"auto"'} />
</div>`;
const a11y = [
  grouped
    ? `- The ${subject} are a group named for the subject ("${label} for …"), and each group within it is named by its label and count.`
    : `- The ${subject} are a list, named for the subject ("${label} for …").`,
  filtered &&
    "- The filters are tabs, named for what they filter. The active tab shows its count, and the list is its tab panel.",
  selectable &&
    '- Each card is a button, pressed while its item is current. Previous and Next are named buttons, and the position ("3 of 10") is announced as it changes.',
  ownScroll &&
    "- The list scrolls on its own, and takes keyboard focus so it can be scrolled.",
  hasStatus &&
    '- A status is never color alone: its label says it, and "+2" is read as "2 more".',
  fields.some((f) => f.kind === "label") &&
    "- Short labels truncate, with the full text in a title.",
  selectable &&
    fields.some((f) => f.kind === "title") &&
    "- Card titles stay on one line. When one is cut off, hovering shows the full title, and screen readers always read it in full.",
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
${filtered ? '| \`filters\` | The tabs that filter the items, each an \`id\` and \`label\`. "All" comes first on its own. |\n' : ""}| \`${collection}\` | Each item's \`id\`, and: ${[...fields.map((f) => `\`${f.name}\`${f.optional ? " (optional)" : ""}`), grouped && "\`group\`", filtered && "\`filter\`"].filter(Boolean).join(", ")} |
${fields.map((f) => `| \`${f.name}\` | ${f.description}${f.kind === "status" ? " A \`label\`, a \`tone\` (neutral, info, success, warning, or error), and \`more\`, how many more it has." : ""} |`).join("\n")}${grouped ? "\n| \`group\` | The label it's grouped under. Groups show in the order they first appear. |" : ""}${filtered ? "\n| \`filter\` | The id of the filter it belongs to. |" : ""}

Your solution maps its own data into this shape with an adapter. The adapter
belongs to your solution, not to the occupant.
${
  selectable
    ? `
## Selection

Your page owns which item is current: pass \`currentId\`, and change it in
\`onSelect\`, usually to open that item in main. Picking a card, or stepping
with Previous and Next, calls \`onSelect\`. Stepping follows the order on
screen${filtered ? ", within the active filter" : ""}.
`
    : ""
}
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
      "registryDependencies": ${JSON.stringify([
        ...(selectable ? ["@uipath/button", "@uipath/card"] : []),
        "@uipath/composition",
        "@uipath/occupant",
        ...(filtered ? ["@uipath/tabs"] : []),
        ...(ownScroll ? ["@uipath/use-scroll-fade"] : []),
      ])},
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
  // check, not format, so imports are sorted too; lint rules stay off here.
  [
    "check",
    "--write",
    "--linter-enabled=false",
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
