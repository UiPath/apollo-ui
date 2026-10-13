/**
 * Prints the registry-check job matrix (apollo-vertex-registry-check.yml): the
 * registry items a PR can affect, batched so each matrix leg installs a handful
 * of components instead of one leg per component.
 *
 * An item is affected when one of its files changed, its registry.json entry
 * changed, or it depends (transitively, via registryDependencies) on an affected
 * or removed item. Changes to shared inputs of the test select every item.
 *
 * Env:
 *   CHANGED_FILES_PATH  newline-separated repo-relative paths changed by the PR
 *   BASE_REGISTRY_PATH  registry.json from the PR's base commit
 *   HEAD_REGISTRY_PATH  registry.json under test (default: the checked-out one)
 *   SELECT_ALL          "true" to select every item regardless of changes
 */
import { readFileSync } from 'node:fs';

const PACKAGE_DIR = 'packages/apollo-vertex/';
const REGISTRY_JSON = `${PACKAGE_DIR}registry.json`;
const BATCH_SIZE = 10;

const SHARED_INPUTS = [
  /^package\.json$/,
  /^\.github\/scripts\/test-registry\//,
  /^\.github\/workflows\/apollo-vertex-registry-check\.yml$/,
  /^packages\/apollo-vertex\/(locales|types)\//,
  /^packages\/apollo-vertex\/(package|components)\.json$/,
  /^packages\/apollo-vertex\/tsconfig[^/]*\.json$/,
  /^apps\/apollo-vertex\/package\.json$/,
  /^apps\/apollo-vertex\/scripts\//,
];

function readItems(path) {
  return JSON.parse(readFileSync(path, 'utf-8')).items;
}

function selectAll(items, reason) {
  console.error(`Testing all ${items.length} items: ${reason}`);
  return items.map((item) => item.name);
}

function select(items) {
  if (process.env.SELECT_ALL === 'true') {
    return selectAll(items, 'SELECT_ALL is set');
  }

  const changedFiles = readFileSync(process.env.CHANGED_FILES_PATH, 'utf-8')
    .split('\n')
    .filter(Boolean);

  const sharedInput = changedFiles.find((file) => SHARED_INPUTS.some((re) => re.test(file)));
  if (sharedInput) {
    return selectAll(items, `shared input ${sharedInput} changed`);
  }

  const reasons = new Map();
  const seed = (name, reason) => {
    if (!reasons.has(name)) reasons.set(name, reason);
  };

  const changed = new Set(changedFiles);
  for (const item of items) {
    const file = (item.files ?? []).find((f) => changed.has(`${PACKAGE_DIR}${f.path}`));
    if (file) seed(item.name, `${PACKAGE_DIR}${file.path} changed`);
  }

  if (changedFiles.includes(REGISTRY_JSON)) {
    const baseItems = new Map(
      readItems(process.env.BASE_REGISTRY_PATH).map((item) => [item.name, JSON.stringify(item)])
    );
    const headNames = new Set(items.map((item) => item.name));
    for (const item of items) {
      const base = baseItems.get(item.name);
      if (base === undefined) seed(item.name, 'added to registry.json');
      else if (base !== JSON.stringify(item)) seed(item.name, 'registry.json entry changed');
    }
    for (const name of baseItems.keys()) {
      if (!headNames.has(name)) seed(name, 'removed from registry.json');
    }
  }

  const queue = [...reasons.keys()];
  while (queue.length > 0) {
    const name = queue.shift();
    for (const item of items) {
      if (reasons.has(item.name) || !item.registryDependencies?.includes(`@uipath/${name}`))
        continue;
      reasons.set(item.name, `depends on ${name}`);
      queue.push(item.name);
    }
  }

  const selected = items.map((item) => item.name).filter((name) => reasons.has(name));
  console.error(`Testing ${selected.length} of ${items.length} items:`);
  for (const name of selected) console.error(`  ${name}: ${reasons.get(name)}`);
  return selected;
}

const names = select(readItems(process.env.HEAD_REGISTRY_PATH ?? REGISTRY_JSON));
const batches = [];
for (let i = 0; i < names.length; i += BATCH_SIZE) {
  batches.push({
    batch_index: i / BATCH_SIZE,
    components: names.slice(i, i + BATCH_SIZE).join(','),
  });
}
console.log(JSON.stringify(batches));
