/**
 * Snapshot Flow Workbench's built-in node definitions for the Flow Node Panels
 * pattern page. Apollo can't depend on Flow (Flow depends on Apollo), so the
 * page reads a copied JSON snapshot instead of importing `@uipath/flow-core`.
 *
 * Usage, from the repository root:
 *   pnpm --filter storybook-app sync:flow-nodes <path-to-flow-workbench>
 *
 * Reads Flow's built manifest entry, so build it first in the Flow checkout:
 *   pnpm --filter @uipath/flow-schema build && pnpm --filter @uipath/flow-core build
 *
 * `--from <module>` reads `ootbNodes`, `inlineAgentNodes` and `categories` from
 * another ESM module instead, for a Flow checkout that can't build.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

type Manifest = {
  nodeType: string;
  version: string;
  category?: string;
  description?: string;
  display?: { label?: string; icon?: string; description?: string };
  inputDefaults?: Record<string, unknown>;
  form?: unknown;
};

type Category = {
  id: string;
  name: string;
  parentId?: string;
  sortOrder?: number;
  icon?: string;
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { from: { type: 'string' } },
});

const flowRoot = positionals[0];
if (!flowRoot) {
  console.error('Usage: sync-flow-node-manifests <path-to-flow-workbench> [--from <module>]');
  process.exit(1);
}

const flowDir = resolve(flowRoot);
const entry = resolve(values.from ?? resolve(flowDir, 'packages/flow-core/dist/manifest.js'));
const { ootbNodes, inlineAgentNodes, categories } = (await import(pathToFileURL(entry).href)) as {
  ootbNodes: Manifest[];
  inlineAgentNodes: Manifest[];
  categories: Category[];
};

function toEntry(manifest: Manifest, audience: 'public' | 'inline-agent') {
  return {
    nodeType: manifest.nodeType,
    version: manifest.version,
    category: manifest.category ?? null,
    label: manifest.display?.label ?? manifest.nodeType,
    icon: manifest.display?.icon ?? null,
    description: manifest.description ?? manifest.display?.description ?? null,
    audience,
    inputDefaults: manifest.inputDefaults ?? {},
    form: manifest.form ?? null,
  };
}

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: flowDir })
  .toString()
  .trim();

const snapshot = {
  source: {
    repository: 'UiPath/flow-workbench',
    commit,
    generatedAt: new Date().toISOString().slice(0, 10),
  },
  categories: categories.map(({ id, name, parentId, sortOrder, icon }) => ({
    id,
    name,
    parentId: parentId ?? null,
    sortOrder: sortOrder ?? 0,
    icon: icon ?? null,
  })),
  nodes: [
    ...ootbNodes.map((manifest) => toEntry(manifest, 'public')),
    ...inlineAgentNodes.map((manifest) => toEntry(manifest, 'inline-agent')),
  ],
};

const outFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/patterns/flow-node-panels/flow-node-manifests.json'
);
writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${snapshot.nodes.length} Flow nodes (flow-workbench@${commit}) to ${outFile}`);
