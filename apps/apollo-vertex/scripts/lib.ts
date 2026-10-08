/*
 * Shared by the occupant scripts: where the app is, the placeholder token,
 * name casing, and reading registry.json.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The app's folder, above scripts/. */
export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The placeholder token, split so the scripts that define it don't contain it. */
export const PLACEHOLDER = ["@fill", "in"].join("-");

/** "key-facts" to "keyFacts". */
export const camel = (name: string) =>
  name.replaceAll(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** "key-facts" to "KeyFacts". */
export const pascal = (name: string) =>
  camel(name).replace(/^[a-z]/, (c) => c.toUpperCase());

export interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  meta?: { layer?: string };
  files?: { path: string }[];
}

/** The items in a registry.json's text. */
export const registryItems = (json: string): RegistryItem[] =>
  (JSON.parse(json) as { items?: RegistryItem[] }).items ?? [];

/** The app's registry.json items. */
export const readRegistry = () =>
  registryItems(readFileSync(join(root, "registry.json"), "utf8"));

/** The names of the items in a layer: "occupant" or "surface". */
export const namesIn = (items: RegistryItem[], layer: string) =>
  items.filter((item) => item.meta?.layer === layer).map((item) => item.name);

/** An occupant's copy-key prefix: "key-facts" to "key_facts_". */
export const keyPrefix = (name: string) => `${name.replaceAll("-", "_")}_`;

/**
 * Why a new occupant's name would share copy keys with something else, or
 * null when it's clear. An occupant owns every key with its prefix, so no
 * existing key may start with it, and it may not nest with another
 * occupant's prefix ("stage" and "stage-strip", "demo" and "demo-extra").
 */
export function keyPrefixCollision(
  name: string,
  keys: readonly string[],
  occupants: readonly string[],
): string | null {
  const prefix = keyPrefix(name);
  const taken = keys.find((key) => key.startsWith(prefix));
  if (taken)
    return `its copy keys would start with "${prefix}", and "${taken}" already does.`;
  const nested = occupants.find((other) => {
    const theirs = keyPrefix(other);
    return (
      other !== name && (prefix.startsWith(theirs) || theirs.startsWith(prefix))
    );
  });
  if (nested)
    return `its copy keys ("${prefix}") would overlap the ${nested} occupant's ("${keyPrefix(nested)}").`;
  return null;
}
