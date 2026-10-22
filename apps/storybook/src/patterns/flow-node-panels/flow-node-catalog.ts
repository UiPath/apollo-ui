import type { FormSchema } from '@uipath/apollo-wind';
import {
  NODE_INVENTORY_ITEMS,
  NODE_PANEL_SPECS,
  type NodeInventoryItem,
} from '../../../../../packages/apollo-react/src/canvas/stories/templates/node-inventory';
import snapshot from './flow-node-manifests.json';

/** One node definition from the Flow Workbench snapshot (see scripts/sync-flow-node-manifests.mts). */
export type FlowNodeManifest = {
  nodeType: string;
  version: string;
  category: string | null;
  label: string;
  icon: string | null;
  description: string | null;
  audience: 'public' | 'inline-agent';
  inputDefaults: Record<string, unknown>;
  form: FormSchema | null;
};

type FlowCategory = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

export type FlowNodePanelItem = {
  /** URL-safe id used in the story's `node` arg, e.g. `core-logic-delay`. */
  slug: string;
  nodeType: string;
  label: string;
  icon: string;
  group: string;
  /** `flow-definition` nodes render from Flow's form schema; `dynamic-example` nodes come from runtime catalogs. */
  source: 'flow-definition' | 'dynamic-example';
  manifest?: FlowNodeManifest;
  /** The inventory entry whose hand-built Figma mockup this node can show instead. */
  designReference?: NodeInventoryItem;
};

export type FlowNodePanelGroup = { name: string; items: FlowNodePanelItem[] };

export const FLOW_SNAPSHOT_SOURCE = snapshot.source;

const FLOW_NODES = snapshot.nodes as FlowNodeManifest[];
const FLOW_CATEGORIES = new Map(
  (snapshot.categories as FlowCategory[]).map((category) => [category.id, category])
);

// Agent tool nodes carry categories outside Flow's category list; they surface
// inside an agent's tool picker rather than the add-node menu.
const AGENT_TOOLS_GROUP: FlowCategory = {
  id: 'agent.tool',
  name: 'Agent tools',
  parentId: null,
  sortOrder: 15,
};

// The runtime catalogs (connectors, resources) have no Flow definition; the
// inventory's examples stand in for them, filed under Flow's own group names.
const DYNAMIC_GROUP_NAMES: Record<string, string> = {
  Connectors: 'Connector',
  Triggers: 'Trigger',
  'Wait for event': 'Wait for event',
  Document: 'Document',
  UiPath: 'Maestro Flow',
};

export function toNodeSlug(nodeType: string) {
  return nodeType.replace(/[^a-zA-Z0-9]+/g, '-');
}

function topLevelCategory(categoryId: string | null): FlowCategory {
  if (categoryId?.startsWith(AGENT_TOOLS_GROUP.id)) return AGENT_TOOLS_GROUP;
  let category = categoryId ? FLOW_CATEGORIES.get(categoryId) : undefined;
  while (category?.parentId) category = FLOW_CATEGORIES.get(category.parentId);
  return category ?? { id: 'other', name: 'Other', parentId: null, sortOrder: 999 };
}

function designReferenceFor(nodeType: string) {
  return NODE_INVENTORY_ITEMS.find(
    (item) => item.nodeType === nodeType && NODE_PANEL_SPECS[item.id] !== undefined
  );
}

function buildGroups(): FlowNodePanelGroup[] {
  const groups = new Map<string, { sortOrder: number; items: FlowNodePanelItem[] }>();
  const add = (category: Pick<FlowCategory, 'name' | 'sortOrder'>, item: FlowNodePanelItem) => {
    const group = groups.get(category.name) ?? { sortOrder: category.sortOrder, items: [] };
    group.items.push(item);
    groups.set(category.name, group);
  };

  for (const manifest of FLOW_NODES) {
    const category = topLevelCategory(manifest.category);
    add(category, {
      slug: toNodeSlug(manifest.nodeType),
      nodeType: manifest.nodeType,
      label: manifest.label,
      icon: manifest.icon ?? 'box',
      group: category.name,
      source: 'flow-definition',
      manifest,
      designReference: designReferenceFor(manifest.nodeType),
    });
  }

  for (const item of NODE_INVENTORY_ITEMS) {
    if (item.source !== 'dynamic') continue;
    const name = DYNAMIC_GROUP_NAMES[item.category] ?? item.category;
    const sortOrder = [...FLOW_CATEGORIES.values()].find((c) => c.name === name)?.sortOrder ?? 999;
    add(
      { name, sortOrder },
      {
        slug: toNodeSlug(item.nodeType),
        nodeType: item.nodeType,
        label: item.label,
        icon: item.icon,
        group: name,
        source: 'dynamic-example',
        designReference: NODE_PANEL_SPECS[item.id] ? item : undefined,
      }
    );
  }

  return [...groups.entries()]
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
    .map(([name, { items }]) => ({ name, items }));
}

export const FLOW_NODE_PANEL_GROUPS = buildGroups();

export const FLOW_NODE_PANEL_ITEMS = FLOW_NODE_PANEL_GROUPS.flatMap((group) => group.items);

export function findFlowNodePanelItem(slug: string | undefined) {
  return slug ? FLOW_NODE_PANEL_ITEMS.find((item) => item.slug === slug) : undefined;
}

/**
 * The node's Flow form schema with its `inputDefaults` as initial data, so the
 * panel opens the way a freshly added node does in Flow Workbench.
 */
export function toPanelSchema(manifest: FlowNodeManifest): FormSchema | undefined {
  if (!manifest.form) return undefined;
  return {
    ...manifest.form,
    initialData: { ...manifest.form.initialData, inputs: manifest.inputDefaults },
    actions: [],
  };
}

/** Every Flow custom field component the snapshot's forms reference. */
export const FLOW_CUSTOM_COMPONENTS = [
  ...new Set(
    FLOW_NODES.flatMap((manifest) =>
      [
        ...(manifest.form?.sections ?? []),
        ...(manifest.form?.steps ?? []).flatMap((step) => step.sections),
      ].flatMap((section) =>
        section.fields.flatMap((field) => (field.type === 'custom' ? [field.component] : []))
      )
    )
  ),
].sort();
