import type { Meta, StoryFn } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Column, Row } from '../../layouts';
import { buildJsonTree } from './buildJsonTree';
import type { JsonTreeNode } from './JsonTree.types';
import { JsonTree } from './JsonTree';

export default {
  title: 'Components/JsonTree',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

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
