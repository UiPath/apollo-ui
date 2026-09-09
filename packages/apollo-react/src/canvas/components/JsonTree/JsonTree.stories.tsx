import type { Meta, StoryFn } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Column, Row } from '../../layouts';
import { buildJsonTree, removeValueAtPath, setValueAtPath } from './buildJsonTree';
import type { JsonObject, JsonTreeNode } from './JsonTree.types';
import { JsonTree } from './JsonTree';

export default {
  title: 'Components/Tree View Code',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
An interactive tree for structured data: a JSON value merged with its schema, rendered as expandable objects and arrays with typed, editable leaves.

## Features

- **Search** – Matches keys and scalar values; matching containers auto-expand
- **Inline editing** – Every JSON type edits in place; objects and arrays open a code editor
- **Copy** – Copy a field's path or its value from the row actions
- **Custom rendering** – Override value cells, type icons, and per-node decorations (labels, chips, badge colors)
- **Virtualization** – Mount only the rows in view for trees with thousands of fields, opt in with \`virtualized\`

## Where this is used

- **Node Property Panel**: the Input / Output 3 Column story renders request and response shapes with this component, via \`NodeIOView\`
- **Templates, Flow Standalone**: node inspector panels throughout the canvas flow demo
        `,
      },
    },
  },
} satisfies Meta<typeof JsonTree>;

const RECORD_COUNT = 20_000;

/**
 * A connector-style response: a status, headers, and a page of records. Built on first
 * render and cached, so opening any other story does not pay for 20k records.
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

function useCollapsed() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (path: string) => setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  return { collapsed, toggle };
}

const frame = { background: 'var(--canvas-background)', color: 'var(--canvas-foreground)' };

/**
 * The tree on its own, with no panel chrome around it: a small, realistic response shape,
 * editable inline. This is the same component the Node Property Panel's Input / Output view
 * renders, via `NodeIOView`.
 */
export const Default: StoryFn = () => {
  const [value, setValue] = useState<JsonObject>({
    code: 200,
    headers: { 'content-type': 'application/json' },
    body: {
      id: '9e415fe5-0001',
      name: 'Record 1',
      isActive: true,
      tags: ['alpha', 'beta'],
    },
  });
  const { collapsed, toggle } = useCollapsed();
  const nodes = useMemo(() => buildJsonTree({ value }), [value]);

  return (
    <Column p={24} gap={12} style={frame}>
      <JsonTree
        nodes={nodes}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        onEdit={(node, nodeValue) => {
          const next =
            nodeValue === undefined
              ? removeValueAtPath(value, node.segments)
              : setValueAtPath(value, node.segments, nodeValue);
          if (next !== undefined) setValue(next as JsonObject);
        }}
      />
    </Column>
  );
};

/** Only the rows in view mount; the tree scrolls inside its own box, capped at the viewport height. */
export const VirtualizedOwnScrollBox: StoryFn = () => {
  const nodes = useLargeTree();
  const { collapsed, toggle } = useCollapsed();
  return (
    <Column p={24} gap={12} minH="100vh" style={frame}>
      <span style={{ fontSize: 14 }}>
        {RECORD_COUNT.toLocaleString()} records, every container expanded. Scroll the tree.
      </span>
      <JsonTree
        nodes={nodes}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        readOnly
        virtualized
      />
    </Column>
  );
};

/** The tree grows to its content and windows rows by the panel's scroll position: one scrollbar. */
export const VirtualizedInsidePanel: StoryFn = () => {
  const nodes = useLargeTree();
  const { collapsed, toggle } = useCollapsed();
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  return (
    <Column p={24} gap={12} h="100vh" style={frame}>
      <span style={{ fontSize: 14 }}>A panel with content above the tree. Scroll the panel.</span>
      <div
        ref={setPanel}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          border: '1px solid var(--canvas-border)',
        }}
      >
        <Row p={16} style={{ borderBottom: '1px solid var(--canvas-border)' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Input</span>
        </Row>
        <Row p={16} style={{ borderBottom: '1px solid var(--canvas-border)' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Output</span>
        </Row>
        <JsonTree
          nodes={nodes}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
          readOnly
          virtualized
          scrollElement={panel}
        />
      </div>
    </Column>
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
    <Column p={24} gap={12} minH="100vh" style={frame}>
      <span style={{ fontSize: 14 }}>Click a value to edit it, scroll away, then scroll back.</span>
      <span style={{ fontSize: 14 }}>Last commit: {lastEdit}</span>
      <JsonTree
        nodes={nodes}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        onEdit={(node, value) => setLastEdit(`${node.path} = ${JSON.stringify(value)}`)}
        virtualized
      />
    </Column>
  );
};

/** Baseline: every row mounts. Kept for comparison; expect a long first paint at this size. */
export const NotVirtualized: StoryFn = () => {
  const nodes = useLargeTree();
  const { collapsed, toggle } = useCollapsed();
  return (
    <Column p={24} gap={12} minH="100vh" style={frame}>
      <span style={{ fontSize: 14 }}>Same value without virtualization.</span>
      <JsonTree nodes={nodes} collapsed={collapsed} onToggleCollapsed={toggle} readOnly />
    </Column>
  );
};
