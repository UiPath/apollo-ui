// Fails when an export target in package.json is missing from dist/, when a
// relative import in the import graph of a JS entry does not resolve, when an
// entry imports a package the manifest does not declare, or when the root
// entry reaches an optional peer. Pass --list to print the external packages
// each entry reaches.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const importRe =
  /(?:^|[;\s])(?:import|export)\s*(?:[^'"]*?from\s*)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function walk(file, seen, externals, errors) {
  if (seen.has(file)) return;
  seen.add(file);
  for (const match of readFileSync(file, "utf8").matchAll(importRe)) {
    const specifier = match[1] ?? match[2];
    if (!specifier.startsWith(".")) {
      externals.add(packageName(specifier));
      continue;
    }
    const target = resolve(dirname(file), specifier);
    if (!existsSync(target)) {
      errors.push(`${relative(root, file)}: cannot resolve ${specifier}`);
    } else if (target.endsWith(".js")) {
      walk(target, seen, externals, errors);
    }
  }
}

const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  // Optional peers that are not on the public registry are declared here only.
  ...Object.keys(pkg.peerDependenciesMeta ?? {}),
]);
const optionalPeers = new Set(
  Object.entries(pkg.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta.optional)
    .map(([name]) => name),
);
const list = process.argv.includes("--list");
const errors = [];
for (const [subpath, target] of Object.entries(pkg.exports)) {
  if (typeof target === "string") {
    // `./locales/*` maps to a directory; other string targets are files.
    const path = join(root, target.replace(/\/\*$/, ""));
    if (!existsSync(path)) errors.push(`${subpath}: missing ${target}`);
    continue;
  }
  for (const file of Object.values(target)) {
    if (!existsSync(join(root, file)))
      errors.push(`${subpath}: missing ${file}`);
  }
  const externals = new Set();
  walk(join(root, target.default), new Set(), externals, errors);
  for (const name of externals) {
    if (!declared.has(name)) {
      errors.push(`${subpath}: imports undeclared package ${name}`);
    } else if (subpath === "." && optionalPeers.has(name)) {
      errors.push(`.: root entry imports optional peer ${name}`);
    }
  }
  if (list) {
    console.log(`${subpath}\n  ${[...externals].sort().join("\n  ")}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
