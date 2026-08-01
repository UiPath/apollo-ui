/**
 * Prints the registry-check job matrix (apollo-vertex-registry-check.yml):
 * every component in apps/apollo-vertex/registry.json, batched so each
 * matrix leg installs a handful of components instead of one leg per
 * component.
 */
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync('apps/apollo-vertex/registry.json', 'utf-8'));
const names = registry.items.map((i) => i.name);
const batchSize = 10;
const batches = [];
for (let i = 0; i < names.length; i += batchSize) {
  batches.push({
    batch_index: Math.floor(i / batchSize),
    components: names.slice(i, i + batchSize).join(','),
  });
}
console.log(JSON.stringify(batches));
