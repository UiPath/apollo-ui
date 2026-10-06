import type { Meta, StoryFn } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import {
  buildJsonTree,
  collectContainerPaths,
  isJsonObject,
  removeValueAtPath,
  setValueAtPath,
} from './buildJsonTree';
import { JsonTreeView } from './JsonTree';
import type {
  JsonObject,
  JsonSchema,
  JsonTreeNode,
  JsonValue,
  NodeDecoration,
} from './JsonTree.types';
import { JsonTreeToolbar } from './JsonTreeToolbar';
import type { JsonTreeViewStrings } from './strings';

const meta: Meta<typeof JsonTreeView> = {
  title: 'Components/Data Display/Tree View (Json)',
  component: JsonTreeView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A tree for exploring and editing JSON data, such as variables, node inputs and outputs, or API responses. Pair it with a JSON schema to show types, descriptions, required fields, and unset values.

## Features

- **Schema aware**: Build nodes with \`buildJsonTree({ schema, value })\`. Fields the schema declares but the value leaves out render as "unset".
- **Inline editing**: Click a value to edit it. Booleans toggle, enums open a dropdown, containers edit as JSON. Pass \`readOnly\` to turn editing off.
- **Copy**: Click a field name to copy its path. The row actions copy the value.
- **Search and filter**: Pass \`query\` and \`filterPredicate\`, or pair the tree with \`JsonTreeToolbar\`.
- **Virtualization**: Pass \`virtualized\` for large values. Only the rows in view mount.
- **Customization**: \`decorateNode\`, \`renderValue\`, \`nodeActions\`, and \`rowWrapper\` change how rows look and behave.
- **Reference variables**: \`decorateNode\` can mark a field as a reference. Its type badge gets a corner arrow and a tooltip naming the source.
- **Localization**: Every string comes from the \`strings\` prop, with English defaults in \`DEFAULT_JSON_TREE_VIEW_STRINGS\`.
        `,
      },
    },
  },
};

export default meta;

const frame = 'flex min-h-screen flex-col gap-3 bg-surface p-6 text-foreground';
const caption = 'text-sm';

const customerSchema: JsonSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', description: 'Full name of the customer.' },
    email: { type: 'string', description: 'Primary contact address.' },
    tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
    active: { type: 'boolean' },
    seats: { type: 'integer' },
    notes: { type: 'string', description: 'Not set yet, so it renders as unset.' },
    address: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        country: { type: 'string' },
      },
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

const customerValue: JsonObject = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  tier: 'pro',
  active: true,
  seats: 12,
  address: { city: 'London', country: 'UK' },
  tags: ['analytics', 'beta'],
};

// Edits never replace the root (every node path has at least one segment), so the
// result stays an object; the guard just keeps the state type honest.
function asObject(value: JsonValue | undefined): JsonObject {
  return isJsonObject(value) ? value : {};
}

function applyEdit(
  root: JsonObject,
  segments: JsonTreeNode['segments'],
  next: JsonValue | undefined
): JsonValue | undefined {
  return next === undefined
    ? removeValueAtPath(root, segments)
    : setValueAtPath(root, segments, next);
}

/** A schema-aware, editable tree with a toolbar for search and collapse all. */
export const Basic: StoryFn = () => {
  const [value, setValue] = useState<JsonObject>(customerValue);
  const [query, setQuery] = useState('');
  const { collapsed, toggle, setCollapsed } = useCollapsed();
  const nodes = useMemo(() => buildJsonTree({ schema: customerSchema, value }), [value]);
  const containerPaths = useMemo(() => collectContainerPaths(nodes), [nodes]);
  const allCollapsed = containerPaths.length > 0 && containerPaths.every((c) => collapsed[c.path]);

  return (
    <div className={frame}>
      <div className="w-full max-w-md rounded-lg border border-border">
        <JsonTreeToolbar
          className="border-b border-border px-2 py-1"
          leading={<span className="text-xs font-medium">customer</span>}
          query={query}
          onQueryChange={setQuery}
          allCollapsed={allCollapsed}
          onToggleAll={() =>
            setCollapsed(
              allCollapsed ? {} : Object.fromEntries(containerPaths.map((c) => [c.path, true]))
            )
          }
        />
        <JsonTreeView
          nodes={nodes}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
          query={query}
          onEdit={(node, next) =>
            setValue((prev) => asObject(applyEdit(prev, node.segments, next)))
          }
        />
      </div>
    </div>
  );
};

const SPANISH_STRINGS: Partial<JsonTreeViewStrings> = {
  unsetValue: 'sin valor',
  itemCount: (count) => (count === 1 ? '1 elemento' : `${count} elementos`),
  keyCount: (count) => (count === 1 ? '1 clave' : `${count} claves`),
  copyPathHint: 'Haz clic para copiar esta ruta',
  copyValue: 'Copiar valor',
  editHint: 'Haz clic para editar',
};

/**
 * Hosts that localize pass translated strings through `strings`. Keys left out keep their
 * English defaults.
 */
export const CustomStrings: StoryFn = () => {
  // No `onEdit`, so nothing is editable, but unset values still show (as "sin valor").
  const nodes = useMemo(() => buildJsonTree({ schema: customerSchema, value: customerValue }), []);
  const { collapsed, toggle } = useCollapsed();
  return (
    <div className={frame}>
      <div className="w-full max-w-md rounded-lg border border-border">
        <JsonTreeView
          nodes={nodes}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
          strings={SPANISH_STRINGS}
        />
      </div>
    </div>
  );
};

const sendEmailValue: JsonObject = {
  to: 'ada@example.com',
  subject: 'Your Pro plan renews soon',
  customerName: 'Ada Lovelace',
  seats: 12,
  sendCopy: false,
  options: { priority: 'normal', trackOpens: true },
};

/**
 * Fields bound to another step's output. Each maps a path in this tree to the
 * source the value is read from.
 */
const REFERENCES: Record<string, string> = {
  to: 'Live from Read customer · output.email',
  customerName: 'Live from Read customer · output.name',
  seats: 'Live from Read customer · output.seats',
  'options.trackOpens': 'Live from Workflow settings · trackOpens',
};

function decorateReference(node: JsonTreeNode): NodeDecoration | undefined {
  const source = REFERENCES[node.path];
  return source ? { badge: { reference: { source } } } : undefined;
}

/**
 * A field that references another variable gets a corner tab with an arrow on its type badge.
 * Hover the badge to see the type and where the value comes from. Mark a node with
 * `decorateNode` returning `{ badge: { reference: { source } } }`.
 */
export const ReferenceVariables: StoryFn = () => {
  const nodes = useMemo(() => buildJsonTree({ value: sendEmailValue }), []);
  const { collapsed, toggle } = useCollapsed();
  return (
    <div className={frame}>
      <span className={caption}>
        Send email inputs. Hover a badge with a corner arrow to see the referenced source.
      </span>
      <div className="w-full max-w-md rounded-lg border border-border">
        <JsonTreeView
          nodes={nodes}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
          decorateNode={decorateReference}
          readOnly
        />
      </div>
    </div>
  );
};

function useCollapsed() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (path: string) => setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  return { collapsed, toggle, setCollapsed };
}

const RECORD_COUNT = 10_000;

/** The unvirtualized baseline mounts every row, so it gets a page it can actually paint. */
const SMALL_RECORD_COUNT = 50;

/**
 * A connector-style response: a status, headers, and a page of records. Built on first
 * render and cached, so opening any other story does not pay to rebuild it.
 */
let cachedNodes: JsonTreeNode[] | undefined;
function useLargeTree(): JsonTreeNode[] {
  return useMemo(() => {
    cachedNodes ??= buildJsonTree({
      value: {
        code: 200,
        headers: { 'content-type': 'application/json', 'x-request-id': 'b2c4a9e0' },
        body: Array.from({ length: RECORD_COUNT }, (_, index) => ({
          id: `9e415fe5-${index.toString(16).padStart(8, '0')}`,
          name: `Record ${index}`,
          isActive: index % 3 !== 0,
          tags: ['alpha', 'beta'],
        })),
      },
    });
    return cachedNodes;
  }, []);
}

/**
 * The same tree with `body` cut to the first `recordCount` records. The nodes are
 * reused as built, so no second tree is constructed and the paths still line up.
 */
function useTruncatedTree(recordCount: number): JsonTreeNode[] {
  const nodes = useLargeTree();
  return useMemo(
    () =>
      nodes.map((node) =>
        node.key === 'body' && node.children
          ? { ...node, children: node.children.slice(0, recordCount) }
          : node
      ),
    [nodes, recordCount]
  );
}

/** Only the rows in view mount; the tree scrolls inside its own box, capped at the viewport height. */
export const VirtualizedOwnScrollBox: StoryFn = () => {
  const nodes = useLargeTree();
  const { collapsed, toggle } = useCollapsed();
  return (
    <div className={frame}>
      <span className={caption}>
        {RECORD_COUNT.toLocaleString()} records, every container expanded. Scroll the tree.
      </span>
      <JsonTreeView
        nodes={nodes}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        readOnly
        virtualized
      />
    </div>
  );
};

/** The tree grows to its content and windows rows by the panel's scroll position: one scrollbar. */
export const VirtualizedInsidePanel: StoryFn = () => {
  const nodes = useLargeTree();
  const { collapsed, toggle } = useCollapsed();
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  return (
    <div className={frame.replace('min-h-screen', 'h-screen')}>
      <span className={caption}>A panel with content above the tree. Scroll the panel.</span>
      <div
        ref={setPanel}
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border"
      >
        <div className="border-b border-border p-4 text-sm font-medium">Input</div>
        <div className="border-b border-border p-4 text-sm font-medium">Output</div>
        <JsonTreeView
          nodes={nodes}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
          readOnly
          virtualized
          scrollElement={panel}
        />
      </div>
    </div>
  );
};

/**
 * Editing survives the window moving: start editing a value, scroll it out of view, scroll back,
 * and the draft is still there. The row being edited stays mounted wherever the window goes.
 */
export const VirtualizedEditable: StoryFn = () => {
  const nodes = useLargeTree();
  const { collapsed, toggle } = useCollapsed();
  const [lastEdit, setLastEdit] = useState<string>('nothing committed yet');
  return (
    <div className={frame}>
      <span className={caption}>Click a value to edit it, scroll away, then scroll back.</span>
      <span className={caption}>Last commit: {lastEdit}</span>
      <JsonTreeView
        nodes={nodes}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        onEdit={(node, value) => setLastEdit(`${node.path} = ${JSON.stringify(value)}`)}
        virtualized
      />
    </div>
  );
};

/** Baseline: every row mounts, on a page small enough that mounting them all is fine. */
export const NotVirtualized: StoryFn = () => {
  const nodes = useTruncatedTree(SMALL_RECORD_COUNT);
  const { collapsed, toggle } = useCollapsed();
  return (
    <div className={frame}>
      <span className={caption}>
        The same shape without virtualization, at {SMALL_RECORD_COUNT} records.
      </span>
      <JsonTreeView nodes={nodes} collapsed={collapsed} onToggleCollapsed={toggle} readOnly />
    </div>
  );
};

// The large-tree stories build a 10,000-record tree, so they stay off the docs page
// (which renders every story inline) and keep it light. Open them from the sidebar.
VirtualizedOwnScrollBox.tags = ['!autodocs'];
VirtualizedInsidePanel.tags = ['!autodocs'];
VirtualizedEditable.tags = ['!autodocs'];
NotVirtualized.tags = ['!autodocs'];
