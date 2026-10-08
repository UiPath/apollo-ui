/**
 * pnpm check:occupant-scope --range <base>..<head>
 *
 * Keeps occupant work out of the shared layers. Each commit in the range
 * that changes an occupant (its registry/<name>/ folder, examples included,
 * or its app/patterns/<name>/ page) may change nothing else except that
 * occupant's own registration:
 *
 *   registry.json                 its item, and no other
 *   tsconfig.json                 its path alias
 *   app/patterns/_meta.ts         its nav entry
 *   locales/en.json               its <name>_ keys
 *   lib/occupants.generated.ts,   the occupant index, derived from
 *   lib/occupant-registry.generated.tsx   registry.json (lint checks it)
 *
 * It may change nothing outside the app. A new occupant's name may not
 * share a key prefix with existing copy or another occupant (see
 * keyPrefixCollision), so every <name>_ key is one the occupant added.
 *
 * The kit, the generator, surfaces, specs, tokens, templates, and tests
 * change in their own commits. A commit made before this check existed is
 * skipped, so it applies from here on.
 *
 *   --app <dir>   the app directory to check (default: this app)
 */

import { execFileSync } from "node:child_process";
import {
  keyPrefix,
  keyPrefixCollision,
  namesIn,
  registryItems,
  root,
} from "./lib.ts";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const app = flag("app") ?? root;
const range = flag("range");
if (!range) {
  console.error("check:occupant-scope: pass --range <base>..<head>.");
  process.exit(1);
}

const git = (...gitArgs: string[]) =>
  execFileSync("git", gitArgs, {
    cwd: app,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // Captured, not printed: a missing file is an expected answer here.
    stdio: ["ignore", "pipe", "pipe"],
  });
/** A file's content at a commit, or null when it isn't there. */
const show = (commit: string, path: string): string | null => {
  try {
    return git("show", `${commit}:${prefix}${path}`);
  } catch {
    return null;
  }
};

// Paths from git are relative to the repository; this is the app's place in it.
const prefix = git("rev-parse", "--show-prefix").trim();
const SELF = "scripts/check-occupant-scope.ts";

const occupantsAt = (commit: string): string[] => {
  const registry = show(commit, "registry.json");
  return registry ? namesIn(registryItems(registry), "occupant") : [];
};

const ownerOf = (path: string, occupants: string[]) =>
  occupants.find(
    (name) =>
      path.startsWith(`registry/${name}/`) ||
      path.startsWith(`app/patterns/${name}/`),
  );

/** Whether a registration file changed only in the named occupants' entries. */
type Registration = (before: string, after: string, names: string[]) => boolean;

const withoutLines = (text: string, test: (line: string) => boolean) =>
  text
    .split("\n")
    .filter((line) => !test(line))
    .join("\n");

const REGISTRATIONS: Record<string, Registration> = {
  "registry.json": (before, after, names) => {
    const strip = (text: string) => {
      const registry = JSON.parse(text);
      registry.items = (registry.items ?? []).filter(
        (item: { name: string }) => !names.includes(item.name),
      );
      return JSON.stringify(registry);
    };
    return strip(before) === strip(after);
  },
  "tsconfig.json": (before, after, names) => {
    const alias = (line: string) =>
      names.some((name) => line.includes(`"@/components/ui/${name}"`));
    return withoutLines(before, alias) === withoutLines(after, alias);
  },
  "app/patterns/_meta.ts": (before, after, names) => {
    const entry = (line: string) =>
      names.some((name) => new RegExp(`^\\s*"?${name}"?\\s*:`).test(line));
    return withoutLines(before, entry) === withoutLines(after, entry);
  },
  "locales/en.json": (before, after, names) => {
    const strip = (text: string) =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(JSON.parse(text)).filter(
            ([key]) => !names.some((name) => key.startsWith(keyPrefix(name))),
          ),
        ),
      );
    return strip(before) === strip(after);
  },
  // Derived from registry.json; lint fails when it doesn't match.
  "lib/occupants.generated.ts": () => true,
  "lib/occupant-registry.generated.tsx": () => true,
};

const problems: string[] = [];
const commits = git("rev-list", "--reverse", "--no-merges", range)
  .split("\n")
  .filter(Boolean);
let checked = 0;

for (const commit of commits) {
  if (show(commit, SELF) === null) continue;
  checked++;
  const parents = git("rev-list", "--parents", "-n", "1", commit)
    .trim()
    .split(" ")
    .slice(1);
  const parent = parents[0] ?? null;
  const all = git(
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--name-only",
    "-r",
    commit,
  )
    .split("\n")
    .filter(Boolean);
  const inApp = (path: string) => path.startsWith(prefix) && path !== prefix;
  const changed = all.filter(inApp).map((path) => path.slice(prefix.length));
  const outside = all.filter((path) => !inApp(path));
  const before = parent ? occupantsAt(parent) : [];
  const occupants = [...new Set([...occupantsAt(commit), ...before])];
  const touched = [
    ...new Set(
      changed
        .map((path) => ownerOf(path, occupants))
        .filter((name): name is string => name !== undefined),
    ),
  ];
  if (touched.length === 0) continue;

  const subject = git("log", "-1", "--format=%h %s", commit).trim();
  for (const path of outside) {
    problems.push(
      `${subject}\n    ${path} is outside the app, so outside the ${touched.join(", ")} occupant.`,
    );
  }
  // A new occupant's key prefix, against the copy and occupants before it.
  const parentCopy = parent ? show(parent, "locales/en.json") : null;
  const keys = parentCopy ? Object.keys(JSON.parse(parentCopy)) : [];
  for (const name of touched.filter((n) => !before.includes(n))) {
    const collision = keyPrefixCollision(name, keys, before);
    if (collision)
      problems.push(
        `${subject}\n    the ${name} occupant's name collides: ${collision}`,
      );
  }
  for (const path of changed) {
    if (ownerOf(path, touched)) continue;
    const registration = REGISTRATIONS[path];
    if (registration) {
      const before = (parent && show(parent, path)) ?? "{}";
      const after = show(commit, path) ?? "{}";
      if (registration(before, after, touched)) continue;
      problems.push(
        `${subject}\n    ${path} changes more than the ${touched.join(", ")} registration.`,
      );
      continue;
    }
    problems.push(
      `${subject}\n    ${path} is outside the ${touched.join(", ")} occupant.`,
    );
  }
}

if (problems.length) {
  console.error(
    `Occupant scope: a commit that changes an occupant may change only its own\n` +
      `folder, examples, Patterns page, and registration. Shared layers (the kit,\n` +
      `the generator, surfaces, specs, tokens, templates, tests) change in their\n` +
      `own commit, from a proposal.\n\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `Occupant scope: ${checked} of ${commits.length} commits checked, all within their occupants.`,
);
