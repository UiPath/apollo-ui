import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Each occupant's registry item declares exactly what its files import:
 * other registry items in registryDependencies, npm packages in
 * dependencies. Installing it then brings everything it needs, and nothing
 * it doesn't.
 */

const ROOT = join(__dirname, "../..");
const registry: {
  items: {
    name: string;
    meta?: { layer?: string };
    files?: { path: string }[];
    dependencies?: string[];
    registryDependencies?: string[];
  }[];
} = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
const paths: Record<string, string[]> = JSON.parse(
  readFileSync(join(ROOT, "tsconfig.json"), "utf8"),
).compilerOptions.paths;

// Provided by every app the registry installs into: the framework, and the
// shadcn baseline's cn() helper.
const BUILT_IN_PACKAGES = new Set(["react", "react-dom", "next"]);
const BASELINE_FILES = new Set(["lib/utils"]);

const withoutExtension = (path: string) =>
  path.replace(/\.(tsx?|js)$/, "").replace(/\/index$/, "");

/** Where an @/ import points, relative to the app root, without extension. */
function resolveAlias(specifier: string): string {
  const exact = paths[specifier]?.[0];
  if (exact) return withoutExtension(exact.replace(/^\.\//, ""));
  return withoutExtension(specifier.replace(/^@\//, ""));
}

const owner = new Map<string, string>();
for (const item of registry.items) {
  for (const file of item.files ?? [])
    owner.set(withoutExtension(file.path), item.name);
}

const importsOf = (path: string) =>
  [
    ...readFileSync(join(ROOT, path), "utf8").matchAll(
      /^\s*(?:import|export)\s[^;]*?from\s+"([^"]+)"/gm,
    ),
  ].map((m) => m[1] ?? "");

const packageName = (specifier: string) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : (specifier.split("/")[0] ?? "");

const occupants = registry.items.filter(
  (item) => item.meta?.layer === "occupant",
);

describe.each(
  occupants.map((item) => [item.name, item] as const),
)("%s", (name, item) => {
  const registryDeps = new Set<string>();
  const packages = new Set<string>();
  const problems: string[] = [];
  for (const file of item.files ?? []) {
    for (const specifier of importsOf(file.path)) {
      if (specifier.startsWith(".")) {
        const target = withoutExtension(join(file.path, "..", specifier));
        if (owner.get(target) !== name)
          problems.push(
            `${file.path} imports ${specifier}, outside its own item`,
          );
      } else if (specifier.startsWith("@/")) {
        const target = resolveAlias(specifier);
        if (BASELINE_FILES.has(target)) continue;
        const from =
          owner.get(target) ??
          (existsSync(join(ROOT, `${target}.ts`))
            ? null
            : owner.get(`${target}/index`));
        if (!from)
          problems.push(
            `${file.path} imports ${specifier}, which no registry item ships`,
          );
        else if (from !== name) registryDeps.add(`@uipath/${from}`);
      } else if (!BUILT_IN_PACKAGES.has(packageName(specifier))) {
        packages.add(packageName(specifier));
      }
    }
  }

  it("imports only from itself, other registry items, and npm packages", () => {
    expect(problems).toEqual([]);
  });

  it("declares exactly the registry items it imports", () => {
    expect([...(item.registryDependencies ?? [])].toSorted()).toEqual(
      [...registryDeps].toSorted(),
    );
  });

  it("declares exactly the npm packages it imports", () => {
    expect([...(item.dependencies ?? [])].toSorted()).toEqual(
      [...packages].toSorted(),
    );
  });
});
