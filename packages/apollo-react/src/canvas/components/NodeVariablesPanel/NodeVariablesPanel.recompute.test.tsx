import * as wind from '@uipath/apollo-wind';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, within } from '../../utils/testing';
import { NodeVariablesPanel } from './NodeVariablesPanel';
import type {
  NodeVariablesPanelProps,
  NodeVariablesSection,
  NodeVariablesSource,
} from './NodeVariablesPanel.types';

// Pass-through spies, so the tests can see which sections the panel rebuilds
// and what each section's tree is handed.
vi.mock('@uipath/apollo-wind', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-wind')>();
  return {
    ...actual,
    buildJsonTree: vi.fn(actual.buildJsonTree),
    collectContainerPaths: vi.fn(actual.collectContainerPaths),
    JsonTreeView: vi.fn(actual.JsonTreeView),
  };
});

const buildJsonTree = vi.mocked(wind.buildJsonTree);
const collectContainerPaths = vi.mocked(wind.collectContainerPaths);
const JsonTreeView = vi.mocked(wind.JsonTreeView);

const INPUTS: NodeVariablesSource[] = [{ id: 'manualTrigger1', label: 'Manual trigger' }];
const NODES: NodeVariablesSource[] = [{ id: 'autonomousAgent1', label: 'Autonomous agent' }];
const VARIABLES = { value: { flowConfig: { region: 'us-east' } } };
const ALL_OPEN: NodeVariablesSection[] = ['inputs', 'outputs', 'variables', 'assets', 'nodes'];

const props: NodeVariablesPanelProps = {
  inputs: INPUTS,
  outputs: { value: { result: 1 } },
  variables: VARIABLES,
  assets: { value: { apiKey: 'key' } },
  nodes: NODES,
};

/** The props the tree was last rendered with for the section whose first row is `firstKey`. */
const lastTreeProps = (firstKey: string) =>
  JsonTreeView.mock.calls.findLast(([treeProps]) => treeProps.nodes[0]?.key === firstKey)?.[0];

describe('NodeVariablesPanel recomputation', () => {
  it.each<[string, Partial<NodeVariablesPanelProps>, string]>([
    [
      'inputs',
      { inputs: [...INPUTS, { id: 'scheduleTrigger1', label: 'Schedule trigger' }] },
      'Schedule trigger',
    ],
    ['outputs', { outputs: { value: { result: 1, total: 2 } } }, 'total'],
    ['variables', { variables: { value: { ...VARIABLES.value, retries: 3 } } }, 'retries'],
    ['assets', { assets: { value: { apiKey: 'key', dbPassword: 'secret' } } }, 'dbPassword'],
    ['nodes', { nodes: [...NODES, { id: 'httpRequest1', label: 'HTTP request' }] }, 'HTTP request'],
  ])('rebuilds only %s when its data changes', (_section, change, shown) => {
    const { rerender } = render(<NodeVariablesPanel {...props} expandedSections={ALL_OPEN} />);

    buildJsonTree.mockClear();
    rerender(<NodeVariablesPanel {...props} {...change} expandedSections={ALL_OPEN} />);
    expect(buildJsonTree).toHaveBeenCalledTimes(1);
    expect(screen.getByText(shown)).toBeInTheDocument();
  });

  it.each<[string, Partial<NodeVariablesPanelProps>]>([
    ['decorateNode', { decorateNode: () => undefined }],
    ['strings', { strings: { sectionVariables: 'Globals' } }],
    ['filters', { filters: [{ id: 'scope', label: 'Scope' }] }],
  ])('rebuilds no tree when only %s changes', (_prop, change) => {
    const { rerender } = render(<NodeVariablesPanel {...props} />);

    buildJsonTree.mockClear();
    rerender(<NodeVariablesPanel {...props} {...change} />);
    expect(buildJsonTree).not.toHaveBeenCalled();
  });

  it('expands a row without re-reading any tree', async () => {
    const user = userEvent.setup();
    render(<NodeVariablesPanel {...props} />);
    // The spy sees the panel's reads, so its silence below means something.
    expect(collectContainerPaths).toHaveBeenCalled();
    const variables = screen.getByRole('region', { name: 'Variables' });
    await user.click(within(variables).getByRole('button', { name: 'Variables' }));

    collectContainerPaths.mockClear();
    await user.click(screen.getByRole('button', { name: 'Expand flowConfig' }));
    expect(screen.getByText('region')).toBeInTheDocument();
    expect(collectContainerPaths).not.toHaveBeenCalled();
  });

  it('windows only a section with more rows than the threshold, in the panel scroller', () => {
    const large = Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`field${i}`, i]));
    render(
      <NodeVariablesPanel
        variables={{ value: large }}
        assets={{ value: { apiKey: 'key' } }}
        expandedSections={['variables', 'assets']}
      />
    );

    const largeTree = lastTreeProps('field0');
    expect(largeTree?.virtualized).toBe(true);
    expect(largeTree?.scrollElement).toBeInstanceOf(HTMLElement);
    const smallTree = lastTreeProps('apiKey');
    expect(smallTree?.virtualized).toBe(false);
    expect(smallTree?.scrollElement).toBeUndefined();
  });
});
