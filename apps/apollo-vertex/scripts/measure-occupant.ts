/**
 * pnpm measure:occupant <name>
 *
 * Measures an occupant's floor: the narrowest width where nothing clips, for
 * every example role in every surface it claims. It compares the floor with
 * the declared minWidth, and fails if the declared width is below it. Set
 * minWidth at or above the floor: above it when the occupant gets hard to
 * read before it breaks.
 *
 * Uses the running dev server on port 3000, or starts one (Playwright's
 * webServer).
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];
const registry: { items: { name: string; meta?: { layer?: string } }[] } =
  JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const occupants = registry.items
  .filter((i) => i.meta?.layer === "occupant")
  .map((i) => i.name);
if (!name || !occupants.includes(name)) {
  console.error(
    `measure:occupant: name a registered occupant: ${occupants.join(", ")}`,
  );
  process.exit(1);
}

const out = mkdtempSync(join(tmpdir(), "measure-occupant-"));
try {
  execFileSync(
    join(root, "node_modules/.bin/playwright"),
    ["test", "-c", "playwright.measure.config.ts"],
    {
      cwd: root,
      env: { ...process.env, OCCUPANT: name, MEASURE_OUT: out },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
} catch (error) {
  // Show why: a stale docs page list or a missing server shows up here.
  const { stdout = "", stderr = "" } = error as {
    stdout?: string;
    stderr?: string;
  };
  console.error(`${stdout}${stderr}`.trim().split("\n").slice(-40).join("\n"));
  console.error(
    "\nmeasure:occupant: the measuring run failed (above). If every page errors, the",
  );
  console.error(
    "dev server's page list is stale: stop it, rm -rf .next/dev, and start it again.",
  );
  process.exit(1);
}
type Result = {
  surface: string;
  orientation: string;
  example: string;
  floor: number | null;
  from: number;
};
const results: Result[] = readdirSync(out).map((file) =>
  JSON.parse(readFileSync(join(out, file), "utf8")),
);
if (results.length === 0) {
  console.error("measure:occupant: the measuring run wrote no results.");
  process.exit(1);
}
const spec = readFileSync(
  join(root, `registry/${name}/${name}.occupant.ts`),
  "utf8",
);
const declared = Number(spec.match(/minWidth:\s*(\d+)/)?.[1] ?? Number.NaN);

const floorText = (r: (typeof results)[number]) =>
  r.floor === null ? `>${r.from}` : r.floor <= 40 ? "<=40" : String(r.floor);

const surfaces = [...new Set(results.map((r) => r.surface))];
const roles = [...new Set(results.map((r) => r.example))];
const rows = [
  ["Surface", "Orientation", ...roles, "Floor"],
  ...surfaces.map((surface) => {
    const forSurface = results.filter((r) => r.surface === surface);
    const floors = forSurface.map((r) => r.floor ?? Number.POSITIVE_INFINITY);
    const worst = Math.max(...floors);
    return [
      surface,
      forSurface[0]?.orientation ?? "",
      ...roles.map((role) => {
        const r = forSurface.find((x) => x.example === role);
        return r ? floorText(r) : "";
      }),
      Number.isFinite(worst) ? String(worst) : "unmeasured",
    ];
  }),
];
const widths =
  rows[0]?.map((_, i) =>
    Math.max(...rows.map((row) => (row[i] ?? "").length)),
  ) ?? [];
console.log(
  `\n${name}: measured floors in px (narrowest width with no clipping)\n`,
);
for (const row of rows)
  console.log(
    `  ${row.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ")}`,
  );

const measured = results.map((r) => r.floor ?? Number.POSITIVE_INFINITY);
const floor = Math.max(...measured);
if (!Number.isFinite(floor)) {
  console.log(
    `\nIt clips even at the widest width tried. Fix the layout, then measure again.`,
  );
  process.exit(1);
}
const worst = results.find(
  (r) => (r.floor ?? Number.POSITIVE_INFINITY) === floor,
);
console.log(
  `\nMeasured floor: ${floor}px (${worst?.surface}, ${worst?.example}). Declared minWidth: ${declared}px.`,
);
if (declared < floor) {
  console.log(
    `Too small: it clips between ${declared}px and ${floor}px. Set minWidth to at least ${floor}.`,
  );
  process.exit(1);
}
console.log(
  declared === floor
    ? "The declared minWidth is the measured floor."
    : `The declared minWidth is ${declared - floor}px above the floor. Keep it there only if it reads better.`,
);
