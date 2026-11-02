import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, userEvent, waitFor, within } from '../../utils/testing';
import type { JsonObject } from '../JsonTree';
import { NodeVariablesPanel } from './NodeVariablesPanel';
import type {
  NodeVariablesFilter,
  NodeVariablesPanelHandle,
  NodeVariablesPanelProps,
  NodeVariablesRow,
  NodeVariablesRowWrapper,
  NodeVariablesSource,
} from './NodeVariablesPanel.types';

const INPUTS: NodeVariablesSource[] = [
  { id: 'manualTrigger1', label: 'Manual trigger', icon: <svg data-testid="manual-icon" /> },
  {
    id: 'messageReceivedInSlack1',
    label: 'Message received in Slack',
    schema: {
      type: 'object',
      properties: {
        output: {
          type: 'object',
          properties: {
            channel_name: { type: 'string' },
            event: { type: 'object', properties: { event_ts: { type: 'string' } } },
          },
        },
      },
    },
  },
  {
    id: 'httpWebhook1',
    label: 'HTTP webhook',
    schema: { type: 'object', properties: { output: { type: 'object' } } },
  },
];

const NODES: NodeVariablesSource[] = [
  { id: 'autonomousAgent1', label: 'Autonomous agent', outputCount: 1 },
];

const VARIABLES = {
  value: {
    flowTest: 'Invoice approval required',
    flowConfig: { region: 'us-east', retryCount: 3 },
    flowArray: ['INV-2041', 'INV-2042'],
  },
};

function renderPanel(props: Partial<NodeVariablesPanelProps> = {}) {
  return render(
    <NodeVariablesPanel
      inputs={INPUTS}
      outputs={{}}
      variables={VARIABLES}
      assets={{}}
      nodes={NODES}
      {...props}
    />
  );
}

const section = (name: string) => screen.getByRole('region', { name });

/** Matches the row a variable callback receives. */
const variableRow = (key: string, rowSection = 'variables') =>
  expect.objectContaining({ section: rowSection, node: expect.objectContaining({ key }) });

/** A host filter keeping one node's rows, like the story's "Selected node". */
const nodeFilter = (nodeId: string): NodeVariablesFilter => ({
  id: 'selected-node',
  label: 'Selected node',
  predicate: (row) => row.nodeId === nodeId,
});
const sectionToggle = (name: string) => within(section(name)).getAllByRole('button')[0]!;

async function openSearch(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('button', { name: 'Search fields and values' }));
  await user.type(screen.getByRole('textbox', { name: 'Search variables' }), text);
}

const ASSETS = {
  value: {
    invoiceApiKey: 'sk-live-example',
    erpCredential: { username: 'svc-invoices', password: '********' },
  },
};

describe('NodeVariablesPanel', () => {
  it('renders every section, with only Nodes open by default', () => {
    renderPanel();

    for (const name of ['Inputs', 'Outputs', 'Variables', 'Assets']) {
      expect(sectionToggle(name)).toHaveAttribute('aria-expanded', 'false');
    }
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Autonomous agent')).toBeInTheDocument();
    expect(screen.queryByText('HTTP webhook')).not.toBeInTheDocument();
  });

  it('follows controlled expandedSections and reports toggles', async () => {
    const user = userEvent.setup();
    const onExpandedSectionsChange = vi.fn();
    const { rerender } = renderPanel({ expandedSections: ['inputs'], onExpandedSectionsChange });

    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'true');
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'false');

    await user.click(sectionToggle('Nodes'));
    // Reported in display order; nothing changes until the host passes it back.
    expect(onExpandedSectionsChange).toHaveBeenCalledWith(['inputs', 'nodes']);
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <NodeVariablesPanel inputs={INPUTS} nodes={NODES} expandedSections={['inputs', 'nodes']} />
    );
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows only the sections whose data is passed', () => {
    render(<NodeVariablesPanel variables={VARIABLES} assets={{}} />);

    const regions = screen
      .getAllByRole('region')
      .map((region) => region.getAttribute('aria-label'));
    expect(regions).toEqual(['Variables', 'Assets']);
  });

  it("sums the inputs' output counts in the Inputs header", () => {
    render(
      <NodeVariablesPanel
        inputs={[
          { id: 'manualTrigger1', label: 'Manual trigger', outputCount: 2 },
          { id: 'httpWebhook1', label: 'HTTP webhook', outputCount: 3 },
        ]}
      />
    );

    expect(screen.getByRole('img', { name: 'Inputs: 5' })).toBeInTheDocument();
  });

  it('opens Inputs on Expand all when its triggers have no outputs yet', async () => {
    const user = userEvent.setup();
    render(
      <NodeVariablesPanel inputs={[{ id: 'manualTrigger1', label: 'Manual trigger' }]} nodes={[]} />
    );

    expect(screen.getByRole('img', { name: 'Inputs: 0' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'true');
  });

  it('counts each section and describes counts for assistive technology', () => {
    renderPanel();

    // Inputs count their triggers' outputs: one each for Slack and the webhook.
    expect(screen.getByRole('img', { name: 'Inputs: 2' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Outputs: 0' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Variables: 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Nodes: 1' })).toBeInTheDocument();
  });

  it('shows each node by name and icon, with its id as the copied reference', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderPanel({ expandedSections: ['inputs'], onCopy });

    expect(within(section('Inputs')).getByTestId('manual-icon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy path for $vars.manualTrigger1' }));

    await waitFor(() =>
      expect(onCopy).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'path', text: '$vars.manualTrigger1' })
      )
    );
  });

  it('shows the node id beside its name only while the row is hovered', () => {
    renderPanel({ expandedSections: ['inputs'] });

    // A node with no output yet names the node; it has no "= null" value.
    expect(within(section('Inputs')).queryByText('null')).toBeNull();

    expect(within(section('Inputs')).getByText('manualTrigger1')).toHaveClass(
      'hidden',
      'group-hover:block'
    );
  });

  it('builds node outputs from the schema and counts them on the node row', async () => {
    const user = userEvent.setup();
    renderPanel({ expandedSections: ['inputs', 'nodes'] });

    // The schema's top-level fields, or the consumer's outputCount.
    expect(screen.getAllByRole('img', { name: 'Outputs: 1' })).toHaveLength(3);
    // Manual trigger has none, like the empty Outputs section.
    expect(screen.getAllByRole('img', { name: 'Outputs: 0' })).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Expand messageReceivedInSlack1' }));
    await user.click(screen.getByRole('button', { name: 'Expand output' }));
    expect(screen.getByText('channel_name')).toBeInTheDocument();
  });

  it('focuses a node from its row, with Focus before the count and + last', async () => {
    const user = userEvent.setup();
    const onFocusNode = vi.fn();
    renderPanel({ onFocusNode, onAdd: vi.fn() });

    const focus = screen.getByRole('button', { name: 'Focus on Autonomous agent' });
    const count = within(section('Nodes')).getByRole('img', { name: 'Outputs: 1' });
    const add = screen.getByRole('button', { name: 'Add from Autonomous agent' });
    // Count and + share the section header's right-edge columns.
    expect(focus.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(count.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(focus);

    expect(onFocusNode).toHaveBeenCalledWith('autonomousAgent1');
  });

  it('hides the focus action without onFocusNode', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: /^Focus on/ })).not.toBeInTheDocument();
  });

  it('adds to Outputs and Variables from the header, and to Inputs and Nodes per node', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderPanel({ onAdd, expandedSections: ['inputs', 'nodes'] });

    await user.click(screen.getByRole('button', { name: 'Add outputs' }));
    await user.click(screen.getByRole('button', { name: 'Add variables' }));
    await user.click(
      within(section('Inputs')).getByRole('button', { name: 'Add from Manual trigger' })
    );
    await user.click(
      within(section('Nodes')).getByRole('button', { name: 'Add from Autonomous agent' })
    );

    expect(onAdd.mock.calls).toEqual([
      ['outputs'],
      ['variables'],
      ['inputs', 'manualTrigger1'],
      ['nodes', 'autonomousAgent1'],
    ]);
    expect(screen.queryByRole('button', { name: 'Add inputs' })).toBeNull();
    // Shown at rest on node rows, like the count and Focus.
    expect(
      within(section('Inputs')).getByRole('button', { name: 'Add from Manual trigger' })
    ).toHaveClass('opacity-100');
  });

  it('copies variable and node output references by clicking the key', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderPanel({ expandedSections: ['variables', 'inputs'], onCopy });

    await user.click(screen.getByRole('button', { name: 'Copy path for $vars.flowTest' }));
    // userEvent.setup() installs a clipboard stub, so read the copy back from it.
    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe('$vars.flowTest'));

    await user.click(screen.getByRole('button', { name: 'Expand messageReceivedInSlack1' }));
    await user.click(
      screen.getByRole('button', { name: 'Copy path for $vars.messageReceivedInSlack1.output' })
    );
    await waitFor(() =>
      expect(onCopy).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: 'path', text: '$vars.messageReceivedInSlack1.output' })
      )
    );
  });

  it('escapes node ids that are not identifiers in copied references', async () => {
    const user = userEvent.setup();
    render(
      <NodeVariablesPanel
        expandedSections={['inputs']}
        inputs={[
          {
            id: 'node-1',
            label: 'Webhook',
            value: { body: 'hi' },
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand node-1' }));
    await user.click(screen.getByRole('button', { name: 'Copy path for $vars["node-1"].body' }));

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe('$vars["node-1"].body')
    );
  });

  it('keeps nodes whose id is a reserved property name', () => {
    render(
      <NodeVariablesPanel
        expandedSections={['nodes']}
        nodes={[{ id: '__proto__', label: 'Proto node', outputCount: 1 }]}
      />
    );

    expect(screen.getByText('Proto node')).toBeInTheDocument();
  });

  it('uses each section metadata when a node is in Inputs and Nodes', () => {
    render(
      <NodeVariablesPanel
        expandedSections={['inputs', 'nodes']}
        inputs={[{ id: 'webhook1', label: 'Webhook (upstream)', outputCount: 2 }]}
        nodes={[{ id: 'webhook1', label: 'Webhook', outputCount: 1 }]}
      />
    );

    expect(within(section('Inputs')).getByText('Webhook (upstream)')).toBeInTheDocument();
    expect(within(section('Inputs')).getByRole('img', { name: 'Outputs: 2' })).toBeInTheDocument();
    expect(within(section('Nodes')).getByText('Webhook')).toBeInTheDocument();
    expect(within(section('Nodes')).getByRole('img', { name: 'Outputs: 1' })).toBeInTheDocument();
  });

  it('keeps expansion separate when the same node is in Inputs and Nodes', async () => {
    const user = userEvent.setup();
    const webhook = { id: 'webhook1', label: 'Webhook', value: { body: 'hi' } };
    render(
      <NodeVariablesPanel
        expandedSections={['inputs', 'nodes']}
        inputs={[webhook]}
        nodes={[webhook]}
      />
    );

    await user.click(within(section('Inputs')).getByRole('button', { name: 'Expand webhook1' }));

    expect(within(section('Inputs')).getByText('body')).toBeInTheDocument();
    expect(within(section('Nodes')).queryByText('body')).toBeNull();
    expect(
      within(section('Nodes')).getByRole('button', { name: 'Expand webhook1' })
    ).toBeInTheDocument();
  });

  it('keeps the declared type of a schema-only scalar node', () => {
    render(
      <NodeVariablesPanel
        expandedSections={['nodes']}
        nodes={[{ id: 'summary1', label: 'Summary', schema: { type: 'string' } }]}
      />
    );

    const row = screen.getByText('Summary').closest('.group')!;
    expect(row.querySelector('svg.lucide-type')).not.toBeNull();
    expect(row.querySelector('svg.lucide-circle-slash-2')).toBeNull();
  });

  it('shows the item shape of a schema-only array, counting no real entries', () => {
    render(
      <NodeVariablesPanel
        expandedSections={['outputs']}
        outputs={{ schema: { type: 'array', items: { type: 'string' } } }}
      />
    );

    expect(screen.getByRole('img', { name: 'Outputs: 0' })).toBeInTheDocument();
    expect(within(section('Outputs')).getByText('item')).toBeInTheDocument();
  });

  it('applies pathForCopy to the prefixed reference', async () => {
    const user = userEvent.setup();
    renderPanel({ expandedSections: ['variables'], pathForCopy: (path) => `{{${path}}}` });

    await user.click(screen.getByRole('button', { name: 'Copy path for {{$vars.flowTest}}' }));

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe('{{$vars.flowTest}}')
    );
  });

  it('references flow outputs directly under the prefix', async () => {
    const user = userEvent.setup();
    renderPanel({
      expandedSections: ['outputs'],
      outputs: { value: { approvalStatus: 'approved' } },
    });

    await user.click(screen.getByRole('button', { name: 'Copy path for $vars.approvalStatus' }));

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe('$vars.approvalStatus')
    );
  });

  it('copies bare tree paths with an empty referencePrefix', async () => {
    const user = userEvent.setup();
    renderPanel({ expandedSections: ['variables'], referencePrefix: '' });

    await user.click(screen.getByRole('button', { name: 'Copy path for flowTest' }));

    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe('flowTest'));
  });

  it('does not count the preview item of a schema-only root array', () => {
    render(
      <NodeVariablesPanel
        inputs={[
          { id: 'list1', label: 'List', schema: { type: 'array', items: { type: 'string' } } },
        ]}
        outputs={{ schema: { type: 'array', items: { type: 'string' } } }}
        variables={{ value: {} }}
        expandedSections={['inputs']}
      />
    );

    // The Outputs section and the List input node both have no real entries.
    expect(screen.getAllByRole('img', { name: 'Outputs: 0' })).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Variables: 0' })).toBeInTheDocument();
  });

  it('edits a variable in a dialog, reading its details from the schema', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{
          schema: {
            type: 'object',
            properties: {
              approved: { type: 'boolean', description: 'Needs a second approver' },
            },
          },
          value: { approved: true },
        }}
        expandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit approved' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    expect(within(dialog).getByRole('textbox', { name: 'ID' })).toBeDisabled();
    expect(within(dialog).getByText('$vars.approved')).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Data type' })).toHaveTextContent(
      'Boolean'
    );
    expect(within(dialog).getByRole('textbox', { name: 'Description' })).toHaveValue(
      'Needs a second approver'
    );
    await user.click(within(dialog).getByRole('switch', { name: 'Default value' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(onEditVariable).toHaveBeenCalledWith(variableRow('approved'), {
      id: 'approved',
      type: 'boolean',
      description: 'Needs a second approver',
      defaultValue: false,
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renames a variable once its ID is unlocked, and rejects a taken or invalid name', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    renderPanel({ expandedSections: ['variables'], onEditVariable });

    await user.click(screen.getByRole('button', { name: 'Edit flowTest' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(dialog).getByRole('button', { name: 'Edit ID' }));
    const id = within(dialog).getByRole('textbox', { name: 'ID' });
    const save = within(dialog).getByRole('button', { name: 'Save' });

    await user.clear(id);
    await user.type(id, 'flowConfig');
    expect(within(dialog).getByText('A variable named flowConfig already exists.')).toBeVisible();
    expect(save).toBeDisabled();

    await user.clear(id);
    await user.type(id, '1st');
    expect(save).toBeDisabled();

    await user.clear(id);
    await user.type(id, 'invoiceStatus');
    expect(within(dialog).getByText('$vars.invoiceStatus')).toBeInTheDocument();
    await user.click(save);

    expect(onEditVariable).toHaveBeenCalledWith(variableRow('flowTest'), {
      id: 'invoiceStatus',
      type: 'string',
      description: undefined,
      defaultValue: 'Invoice approval required',
    });
  });

  it('keeps an unset Boolean default unset when saved untouched', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{ schema: { type: 'object', properties: { approved: { type: 'boolean' } } } }}
        expandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit approved' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    expect(within(dialog).getByRole('switch', { name: 'Default value' })).not.toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(onEditVariable).toHaveBeenCalledWith(
      variableRow('approved'),
      expect.objectContaining({ type: 'boolean', defaultValue: undefined })
    );
  });

  it('saves an explicit false, and Clear returns a Boolean default to unset', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{ schema: { type: 'object', properties: { approved: { type: 'boolean' } } } }}
        expandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit approved' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    expect(within(dialog).getByText('No default. Toggle on for true, off for false')).toBeVisible();
    const toggle = within(dialog).getByRole('switch', { name: 'Default value' });
    await user.click(toggle);
    await user.click(toggle);
    expect(within(dialog).getByText('Toggle on for true, off for false')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onEditVariable).toHaveBeenLastCalledWith(
      variableRow('approved'),
      expect.objectContaining({ defaultValue: false })
    );

    await user.click(screen.getByRole('button', { name: 'Edit approved' }));
    const reopened = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(reopened).getByRole('switch', { name: 'Default value' }));
    await user.click(within(reopened).getByRole('button', { name: 'Clear default value' }));
    await user.click(within(reopened).getByRole('button', { name: 'Save' }));
    expect(onEditVariable).toHaveBeenLastCalledWith(
      variableRow('approved'),
      expect.objectContaining({ defaultValue: undefined })
    );
  });

  it('keeps an explicit null default when saved untouched', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{
          schema: { type: 'object', properties: { note: { type: 'string', default: null } } },
          value: { note: 'runtime text' },
        }}
        expandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(onEditVariable).toHaveBeenCalledWith(
      variableRow('note'),
      expect.objectContaining({ type: 'string', defaultValue: null })
    );
  });

  it('clears an explicit null default once the field is edited', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{
          schema: { type: 'object', properties: { note: { type: 'string', default: null } } },
        }}
        expandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    const field = within(dialog).getByRole('textbox', { name: 'Default value' });
    expect(field).toHaveAttribute('placeholder', 'null');
    // Typed and deleted: back to empty, but edited, so the default is cleared.
    await user.type(field, 'x{Backspace}');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(onEditVariable).toHaveBeenCalledWith(
      variableRow('note'),
      expect.objectContaining({ defaultValue: undefined })
    );
  });

  it('rejects renaming onto a variable the schema declares but the value omits', async () => {
    const user = userEvent.setup();
    render(
      <NodeVariablesPanel
        variables={{
          schema: {
            type: 'object',
            properties: { flowTest: { type: 'string' }, pending: { type: 'string' } },
          },
          value: { flowTest: 'a' },
        }}
        expandedSections={['variables']}
        onEditVariable={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit flowTest' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(dialog).getByRole('button', { name: 'Edit ID' }));
    const id = within(dialog).getByRole('textbox', { name: 'ID' });
    await user.clear(id);
    await user.type(id, 'pending');

    expect(within(dialog).getByText('A variable named pending already exists.')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('validates a JSON default value against the data type', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    renderPanel({ expandedSections: ['variables'], onEditVariable });

    await user.click(screen.getByRole('button', { name: 'Edit flowConfig' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    const field = within(dialog).getByRole('textbox', { name: 'Default value' });
    expect(JSON.parse((field as HTMLTextAreaElement).value)).toEqual({
      region: 'us-east',
      retryCount: 3,
    });

    fireEvent.change(field, { target: { value: '[1, 2]' } });
    expect(within(dialog).getByText('Enter a valid JSON object.')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.change(field, { target: { value: '{"region": "eu"}' } });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onEditVariable).toHaveBeenCalledWith(
      variableRow('flowConfig'),
      expect.objectContaining({ type: 'object', defaultValue: { region: 'eu' } })
    );
  });

  it('cancels an edit without saving or letting keys reach the host', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <div onKeyDown={onKeyDown}>
        <NodeVariablesPanel
          variables={{ value: { flowTest: 'a' } }}
          expandedSections={['variables']}
          onEditVariable={onEditVariable}
        />
      </div>
    );

    await user.click(screen.getByRole('button', { name: 'Edit flowTest' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Description' }), 'x');
    onKeyDown.mockClear();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onEditVariable).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('deletes a top-level variable through its row action', async () => {
    const user = userEvent.setup();
    const onDeleteVariable = vi.fn();
    renderPanel({ expandedSections: ['variables'], onDeleteVariable });

    await user.click(screen.getByRole('button', { name: 'Delete flowConfig' }));

    expect(onDeleteVariable).toHaveBeenCalledWith(variableRow('flowConfig'));
    // Nested fields aren't variables, so they have no delete action.
    await user.click(screen.getByRole('button', { name: 'Expand flowConfig' }));
    expect(screen.queryByRole('button', { name: 'Delete region' })).toBeNull();
  });

  it('offers no name-based actions for array items passed as variables', () => {
    render(
      <NodeVariablesPanel
        // Untyped consumers can still pass an array; its items aren't named variables.
        variables={{ value: ['a'] as unknown as JsonObject }}
        expandedSections={['variables']}
        onEditVariable={vi.fn()}
        onDeleteVariable={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Delete / })).toBeNull();
  });

  it('closes search on Escape without letting it reach the canvas', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <div onKeyDown={onKeyDown}>
        <NodeVariablesPanel variables={{ value: { flowTest: 'a' } }} />
      </div>
    );

    await openSearch(user, '{Escape}');

    expect(screen.queryByRole('textbox', { name: 'Search variables' })).toBeNull();
    expect(onKeyDown).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
  });

  it('finds nested keys while searching and hides sections without matches', async () => {
    const user = userEvent.setup();
    renderPanel();

    await openSearch(user, 'region');

    expect(screen.getByText('region')).toBeInTheDocument();
    expect(section('Variables')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Inputs' })).not.toBeInTheDocument();
  });

  it('matches node names and ids while searching', async () => {
    const user = userEvent.setup();
    renderPanel();

    await openSearch(user, 'webhook');
    expect(screen.getByText('HTTP webhook')).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Search variables' }));
    await user.type(screen.getByRole('textbox', { name: 'Search variables' }), 'autonomousAgent');
    expect(screen.getByText('Autonomous agent')).toBeInTheDocument();
  });

  it('says so when nothing matches the search', async () => {
    const user = userEvent.setup();
    renderPanel();

    await openSearch(user, 'zzz');

    expect(screen.getByText('No variables match your search.')).toBeInTheDocument();
  });

  it('narrows to the rows a host filter keeps, hiding sections with none', async () => {
    const user = userEvent.setup();
    renderPanel({ filters: [nodeFilter('httpWebhook1')] });

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Selected node' }));

    await waitFor(() => expect(screen.getByText('HTTP webhook')).toBeInTheDocument());
    expect(screen.queryByText('Message received in Slack')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Variables' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Nodes' })).not.toBeInTheDocument();
  });

  it('keeps Expand all while the selected-node filter is on, expanding its containers', async () => {
    const user = userEvent.setup();
    renderPanel({ filters: [nodeFilter('messageReceivedInSlack1')] });

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Selected node' }));
    await user.click(await screen.findByRole('button', { name: 'Expand all' }));

    expect(screen.getByText('channel_name')).toBeInTheDocument();
  });

  it('expands and edits a variable named after an Object.prototype member', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{
          schema: {
            type: 'object',
            properties: {
              constructor: { type: 'object', properties: { name: { type: 'string' } } },
              toString: { type: 'string' },
            },
          },
          value: {},
        }}
        expandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand constructor' }));
    expect(screen.getByText('name')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit toString' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    // The value omits it, so there is no default, not the inherited function.
    expect(onEditVariable).toHaveBeenCalledWith(
      variableRow('toString'),
      expect.objectContaining({ type: 'string', defaultValue: undefined })
    );
  });

  it('offers a filter menu only when the host passes filters', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: 'Filter' })).toBeNull();
  });

  it('passes each row its section and node, so a filter can keep the flow variables', async () => {
    const predicate = vi.fn(
      ({ section: rowSection, nodeId }: NodeVariablesRow) =>
        rowSection === 'variables' || nodeId === 'manualTrigger1'
    );
    renderPanel({
      filters: [{ id: 'upstream', label: 'Upstream', predicate }],
      activeFilterId: 'upstream',
    });

    expect(await screen.findByRole('region', { name: 'Variables' })).toBeInTheDocument();
    expect(screen.getByText('Manual trigger')).toBeInTheDocument();
    expect(screen.queryByText('HTTP webhook')).not.toBeInTheDocument();
    expect(predicate).toHaveBeenCalledWith(
      expect.objectContaining({ section: 'inputs', nodeId: 'manualTrigger1' })
    );
  });

  it('follows a controlled active filter and reports changes from the menu', async () => {
    const user = userEvent.setup();
    const onActiveFilterChange = vi.fn();
    const { rerender } = render(
      <NodeVariablesPanel
        inputs={INPUTS}
        variables={VARIABLES}
        nodes={NODES}
        filters={[nodeFilter('httpWebhook1')]}
        activeFilterId={null}
        onActiveFilterChange={onActiveFilterChange}
      />
    );
    expect(screen.getByRole('region', { name: 'Variables' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Selected node' }));
    expect(onActiveFilterChange).toHaveBeenCalledWith('selected-node');
    // Controlled: nothing narrows until the host passes the new id.
    expect(screen.getByRole('region', { name: 'Variables' })).toBeInTheDocument();

    rerender(
      <NodeVariablesPanel
        inputs={INPUTS}
        variables={VARIABLES}
        nodes={NODES}
        filters={[nodeFilter('httpWebhook1')]}
        activeFilterId="selected-node"
        onActiveFilterChange={onActiveFilterChange}
      />
    );
    expect(screen.queryByRole('region', { name: 'Variables' })).not.toBeInTheDocument();
  });

  it("shows the filter's empty message when it leaves nothing", () => {
    renderPanel({
      filters: [{ ...nodeFilter('missing'), emptyMessage: 'Nothing upstream.' }],
      activeFilterId: 'selected-node',
    });

    expect(screen.getByText('Nothing upstream.')).toBeInTheDocument();
  });

  it('expands objects but leaves empty sections and arrays alone with expand all', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));

    for (const name of ['Inputs', 'Variables', 'Nodes']) {
      expect(sectionToggle(name)).toHaveAttribute('aria-expanded', 'true');
    }
    expect(sectionToggle('Outputs')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('channel_name')).toBeInTheDocument();
    expect(screen.getByText('region')).toBeInTheDocument();
    expect(screen.queryByText('"INV-2041"')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'false');
  });

  it('leaves objects inside an array alone with expand all', async () => {
    const user = userEvent.setup();
    render(<NodeVariablesPanel outputs={{ value: { rows: [{ region: 'us-east' }] } }} />);

    await user.click(screen.getByRole('button', { name: 'Expand all' }));

    expect(sectionToggle('Outputs')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('region')).not.toBeInTheDocument();
  });

  it('offers Expand all, not Collapse all, when there is nothing to expand', () => {
    render(<NodeVariablesPanel />);

    expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument();
  });

  it('keeps containers that appear later collapsed by default', () => {
    const { rerender } = renderPanel({ expandedSections: ['variables'] });

    // Renaming the object variable introduces a new container path.
    rerender(
      <NodeVariablesPanel
        inputs={INPUTS}
        nodes={NODES}
        expandedSections={['variables']}
        variables={{ value: { flowTest: 'x', settings: { region: 'us-east' } } }}
      />
    );

    expect(screen.getByRole('button', { name: 'Expand settings' })).toBeInTheDocument();
    expect(screen.queryByText('region')).not.toBeInTheDocument();
  });

  it('opens matches while searching, lets them collapse, and restores the expansion after', async () => {
    const user = userEvent.setup();
    const onExpandedSectionsChange = vi.fn();
    renderPanel({ onExpandedSectionsChange });

    await openSearch(user, 'region');
    expect(sectionToggle('Variables')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('region')).toBeInTheDocument();

    // Matches can be collapsed, rows and sections alike.
    await user.click(screen.getByRole('button', { name: 'Collapse flowConfig' }));
    expect(screen.queryByText('region')).not.toBeInTheDocument();
    await user.click(sectionToggle('Variables'));
    expect(sectionToggle('Variables')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument();

    // A new query opens its matches again.
    const searchBox = screen.getByRole('textbox', { name: 'Search variables' });
    await user.type(searchBox, 'X');
    await user.type(searchBox, '{Backspace}');
    expect(sectionToggle('Variables')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('region')).toBeInTheDocument();

    // Clearing the search brings back the expansion from before it, untouched.
    await user.clear(searchBox);
    expect(sectionToggle('Variables')).toHaveAttribute('aria-expanded', 'false');
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedSectionsChange).not.toHaveBeenCalled();
  });

  it('lets a filter without a predicate leave rows, expansion, and empty sections alone', async () => {
    const user = userEvent.setup();
    renderPanel({
      filters: [{ id: 'scope', label: 'Scope' }],
      activeFilterId: 'scope',
    });

    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'false');
    expect(section('Outputs')).toBeInTheDocument();
    await user.click(sectionToggle('Nodes'));
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the sections a narrowing filter keeps, and lets them collapse', async () => {
    const user = userEvent.setup();
    renderPanel({ filters: [nodeFilter('httpWebhook1')], activeFilterId: 'selected-node' });

    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'true');
    await user.click(sectionToggle('Inputs'));
    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'false');
  });

  it('draws a top and bottom edge only while content is scrolled past them', () => {
    const { container } = renderPanel();
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
    // happy-dom has no layout, so the scroll metrics are stubbed in.
    const scrollTo = (scrollTop: number) => {
      Object.defineProperties(scroller, {
        scrollTop: { value: scrollTop, configurable: true },
        clientHeight: { value: 400, configurable: true },
        scrollHeight: { value: 1000, configurable: true },
      });
      fireEvent.scroll(scroller);
    };
    const edge = (side: 'top' | 'bottom') => container.querySelector(`[data-edge="${side}"]`);

    scrollTo(0);
    expect(edge('top')).not.toBeInTheDocument();
    expect(edge('bottom')).toBeInTheDocument();

    scrollTo(300);
    expect(edge('top')).toBeInTheDocument();
    expect(edge('bottom')).toBeInTheDocument();

    scrollTo(600);
    expect(edge('top')).toBeInTheDocument();
    expect(edge('bottom')).not.toBeInTheDocument();
  });

  it('watches a stable content wrapper so remounted sections update the scroll edges', () => {
    const observed: Element[] = [];
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      observe(element: Element) {
        observed.push(element);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    try {
      const { container } = renderPanel();
      const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
      expect(observed).toEqual([scroller, scroller.firstElementChild]);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it('handles very wide object trees without overflowing the stack', () => {
    const wide = Object.fromEntries(
      Array.from({ length: 150_000 }, (_, index) => [`field${index}`, {}])
    );

    expect(() => renderPanel({ variables: { value: { wide } } })).not.toThrow();
  });

  it('windows the rows of a large section instead of mounting them all', () => {
    const many = Object.fromEntries(
      Array.from({ length: 600 }, (_, index) => [`field${index}`, index])
    );
    render(<NodeVariablesPanel expandedSections={['variables']} variables={{ value: many }} />);

    const rows = within(section('Variables')).queryAllByRole('button', { name: /^Copy path for/ });
    expect(rows.length).toBeLessThan(600);
  });

  it('renders small sections in full', () => {
    renderPanel({ expandedSections: ['variables'] });

    expect(
      within(section('Variables')).getAllByRole('button', { name: /^Copy path for/ })
    ).toHaveLength(3);
  });

  it('gives top-level Outputs edit and delete by default, with the row', async () => {
    const user = userEvent.setup();
    const onDeleteVariable = vi.fn();
    renderPanel({
      expandedSections: ['outputs'],
      outputs: { value: { result: 'ok' } },
      onEditVariable: vi.fn(),
      onDeleteVariable,
    });

    expect(screen.getByRole('button', { name: 'Edit result' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete result' }));
    expect(onDeleteVariable).toHaveBeenCalledWith(variableRow('result', 'outputs'));
  });

  it('lets isVariableRow pick variable rows in any section', async () => {
    const user = userEvent.setup();
    const onDeleteVariable = vi.fn();
    render(
      <NodeVariablesPanel
        inputs={[
          { id: 'trigger1', label: 'Manual trigger', value: { output: { invoiceId: 'INV-1' } } },
        ]}
        expandedSections={['inputs']}
        // A trigger input backed by a flow variable lives at <trigger>.output.<var>.
        isVariableRow={({ section: rowSection, node }) =>
          rowSection === 'inputs' && node.segments.length === 3
        }
        onDeleteVariable={onDeleteVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand trigger1' }));
    await user.click(screen.getByRole('button', { name: 'Expand output' }));
    expect(screen.queryByRole('button', { name: 'Delete output' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Delete invoiceId' }));
    expect(onDeleteVariable).toHaveBeenCalledWith(
      expect.objectContaining({ section: 'inputs', nodeId: 'trigger1' })
    );
  });

  it('calls onRequestEditVariable when there is no built-in dialog', async () => {
    const user = userEvent.setup();
    const onRequestEditVariable = vi.fn();
    renderPanel({ expandedSections: ['variables'], onRequestEditVariable });

    await user.click(screen.getByRole('button', { name: 'Edit flowTest' }));

    expect(onRequestEditVariable).toHaveBeenCalledWith(variableRow('flowTest'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the built-in dialog for variables while the host edits assets', async () => {
    const user = userEvent.setup();
    const onRequestEditVariable = vi.fn();
    renderPanel({
      expandedSections: ['variables', 'assets'],
      assets: ASSETS,
      onEditVariable: vi.fn(),
      onRequestEditVariable,
    });

    await user.click(screen.getByRole('button', { name: 'Edit flowTest' }));
    expect(await screen.findByRole('dialog', { name: 'Edit variable' })).toBeInTheDocument();
    expect(onRequestEditVariable).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Edit invoiceApiKey' }));
    expect(onRequestEditVariable).toHaveBeenCalledWith(variableRow('invoiceApiKey', 'assets'));
  });

  it('hides the row + for a source that is not addable', () => {
    renderPanel({
      expandedSections: ['inputs'],
      inputs: [
        { id: 'connectorTrigger1', label: 'Connector trigger', addable: false },
        { id: 'manualTrigger1', label: 'Manual trigger' },
      ],
      onAdd: vi.fn(),
    });

    expect(screen.queryByRole('button', { name: 'Add from Connector trigger' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add from Manual trigger' })).toBeInTheDocument();
  });

  it('passes rowWrapper and deriveTypeIcon to every section, and renders children after Nodes', () => {
    renderPanel({
      expandedSections: ['variables', 'nodes'],
      rowWrapper: ({ node, className, style, onClick, children }) => (
        <div data-testid={`row-${node.key}`} className={className} style={style} onClick={onClick}>
          {children}
        </div>
      ),
      deriveTypeIcon: (node) =>
        node.key === 'flowTest' ? <svg data-testid="custom-icon" /> : undefined,
      children: <section aria-label="Assets" />,
    });

    expect(screen.getByTestId('row-flowTest')).toBeInTheDocument();
    expect(screen.getByTestId('row-autonomousAgent1')).toBeInTheDocument();
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    const regions = screen
      .getAllByRole('region')
      .map((region) => region.getAttribute('aria-label'));
    expect(regions.at(-1)).toBe('Assets');
  });

  it("keeps a node's icon under a host badge, and names badges by deriveTypeLabel", () => {
    renderPanel({
      expandedSections: ['inputs', 'variables'],
      decorateNode: ({ node }) =>
        node.segments.length === 1 ? { badge: { reference: {} } } : undefined,
      deriveTypeLabel: (node) => (node.key === 'flowTest' ? 'Flag' : undefined),
    });

    // The host's badge merges over the built-in one, so the node icon stays.
    expect(within(section('Inputs')).getByTestId('manual-icon')).toBeInTheDocument();
    expect(
      within(section('Variables')).getByRole('img', { name: 'Flag · reference' })
    ).toBeInTheDocument();
  });

  it('unlocks the ID when the existing one is not a valid identifier', async () => {
    const user = userEvent.setup();
    render(
      <NodeVariablesPanel
        variables={{ value: { 'bad-name': 'a' } }}
        expandedSections={['variables']}
        onEditVariable={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit bad-name' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });

    expect(within(dialog).getByRole('textbox', { name: 'ID' })).toBeEnabled();
    expect(
      within(dialog).getByText(
        'Use a letter or underscore first, then letters, numbers, or underscores.'
      )
    ).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('places Assets between Variables and Nodes, collapsed by default', () => {
    renderPanel({ assets: ASSETS });

    const names = screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'));
    expect(names).toEqual(['Inputs', 'Outputs', 'Variables', 'Assets', 'Nodes']);
    expect(sectionToggle('Assets')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('img', { name: 'Assets: 2' })).toBeInTheDocument();
    expect(screen.queryByText('invoiceApiKey')).not.toBeInTheDocument();
  });

  it('shows the declared assets once Assets is opened', async () => {
    const user = userEvent.setup();
    renderPanel({ assets: ASSETS });

    await user.click(sectionToggle('Assets'));

    expect(within(section('Assets')).getByText('invoiceApiKey')).toBeInTheDocument();
    expect(within(section('Assets')).getByText('erpCredential')).toBeInTheDocument();
  });

  it('references assets under $assets, not $vars', async () => {
    const user = userEvent.setup();
    renderPanel({ expandedSections: ['assets'], assets: ASSETS });

    await user.click(screen.getByRole('button', { name: 'Copy path for $assets.invoiceApiKey' }));

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe('$assets.invoiceApiKey')
    );
    await user.click(screen.getByRole('button', { name: 'Expand erpCredential' }));
    expect(
      screen.getByRole('button', { name: 'Copy path for $assets.erpCredential.username' })
    ).toBeInTheDocument();
  });

  it('honors assetsReferencePrefix', () => {
    renderPanel({
      expandedSections: ['assets'],
      assets: ASSETS,
      assetsReferencePrefix: '$orchestrator',
    });

    expect(
      screen.getByRole('button', { name: 'Copy path for $orchestrator.invoiceApiKey' })
    ).toBeInTheDocument();
  });

  it('adds an asset from the Assets header', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderPanel({ assets: ASSETS, onAdd });

    await user.click(screen.getByRole('button', { name: 'Add asset' }));

    expect(onAdd).toHaveBeenCalledWith('assets');
  });

  it('gives asset rows the shared edit and delete callbacks, with the row to tell them apart', async () => {
    const user = userEvent.setup();
    const onRequestEditVariable = vi.fn();
    const onDeleteVariable = vi.fn();
    renderPanel({
      expandedSections: ['assets'],
      assets: ASSETS,
      onEditVariable: vi.fn(),
      onRequestEditVariable,
      onDeleteVariable,
    });

    await user.click(screen.getByRole('button', { name: 'Edit invoiceApiKey' }));
    await user.click(screen.getByRole('button', { name: 'Delete invoiceApiKey' }));

    expect(onRequestEditVariable).toHaveBeenCalledWith(variableRow('invoiceApiKey', 'assets'));
    expect(onDeleteVariable).toHaveBeenCalledWith(variableRow('invoiceApiKey', 'assets'));
    expect(screen.queryByRole('dialog')).toBeNull();
    // Nested fields aren't assets, so they have no delete action.
    await user.click(screen.getByRole('button', { name: 'Expand erpCredential' }));
    expect(screen.queryByRole('button', { name: 'Delete username' })).toBeNull();
  });

  it('never opens the built-in dialog for assets, and a permissive isVariableRow cannot reach them', async () => {
    const user = userEvent.setup();
    renderPanel({
      expandedSections: ['assets'],
      assets: ASSETS,
      isVariableRow: () => true,
      // No onRequestEditVariable: the built-in dialog edits variables, not assets.
      onEditVariable: vi.fn(),
      onDeleteVariable: vi.fn(),
    });

    expect(screen.queryByRole('button', { name: 'Edit invoiceApiKey' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete invoiceApiKey' })).toBeInTheDocument();
    // Nested asset fields get no edit or delete at all.
    await user.click(screen.getByRole('button', { name: 'Expand erpCredential' }));
    expect(screen.queryByRole('button', { name: 'Delete username' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit username' })).toBeNull();
  });

  it('prefixes a renamed asset reference with assetsBasePath', async () => {
    const user = userEvent.setup();
    renderPanel({
      expandedSections: ['assets'],
      assets: ASSETS,
      assetsBasePath: 'orchestrator',
    });

    expect(
      screen.getByRole('button', { name: 'Copy path for $assets.orchestrator.invoiceApiKey' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand erpCredential' }));
    expect(
      screen.getByRole('button', {
        name: 'Copy path for $assets.orchestrator.erpCredential.username',
      })
    ).toBeInTheDocument();
  });

  it('has no accessibility violations with every section open', async () => {
    const { container } = renderPanel({
      expandedSections: ['inputs', 'outputs', 'variables', 'assets', 'nodes'],
      assets: ASSETS,
      onAdd: vi.fn(),
      onFocusNode: vi.fn(),
      onEditVariable: vi.fn(),
      onDeleteVariable: vi.fn(),
      onRequestEditVariable: vi.fn(),
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("hands the row wrapper each row's section, node, and reference", () => {
    const seen: string[] = [];
    const Wrapper: NodeVariablesRowWrapper = ({
      section: rowSection,
      nodeId,
      displayPath,
      className,
      style,
      onClick,
      children,
    }) => {
      seen.push(`${rowSection} ${nodeId ?? '-'} ${displayPath}`);
      return (
        <div className={className} style={style} onClick={onClick}>
          {children}
        </div>
      );
    };
    renderPanel({
      expandedSections: ['variables', 'assets', 'nodes'],
      assets: ASSETS,
      rowWrapper: Wrapper,
    });

    expect(seen).toContain('variables - $vars.flowTest');
    expect(seen).toContain('assets - $assets.invoiceApiKey');
    expect(seen).toContain('nodes autonomousAgent1 $vars.autonomousAgent1');
  });

  it('merges decorateNode over the built-in decoration, in every section', () => {
    renderPanel({
      expandedSections: ['assets', 'nodes'],
      assets: ASSETS,
      decorateNode: ({ section: rowSection, node }) => {
        if (rowSection === 'assets' && node.key === 'invoiceApiKey') {
          return { chip: { label: 'Missing', tone: 'warning' } };
        }
        return rowSection === 'nodes' ? { sublabel: 'Agent' } : undefined;
      },
    });

    expect(screen.getByText('Missing')).toBeInTheDocument();
    // The host's sublabel wins over the node id; the built-in label stays.
    expect(screen.getByText('Autonomous agent')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.queryByText('autonomousAgent1')).toBeNull();
  });

  it('keeps the built-in decoration for a field decorateNode leaves undefined', () => {
    renderPanel({
      expandedSections: ['nodes'],
      decorateNode: ({ section: rowSection }) =>
        rowSection === 'nodes' ? { label: undefined, sublabel: 'Agent' } : undefined,
    });

    expect(screen.getByText('Autonomous agent')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it("hands the row callbacks each row's reference", () => {
    const seen = new Set<string>();
    renderPanel({
      expandedSections: ['variables', 'assets', 'nodes'],
      assets: ASSETS,
      decorateNode: ({ node, displayPath }) => {
        if (node.segments.length === 1) seen.add(displayPath);
        return undefined;
      },
    });

    expect(seen).toContain('$vars.flowTest');
    expect(seen).toContain('$assets.invoiceApiKey');
    expect(seen).toContain('$vars.autonomousAgent1');
  });

  it('lets nodeActions add to the built-in actions of any row', async () => {
    const user = userEvent.setup();
    const openAsset = vi.fn();
    renderPanel({
      expandedSections: ['assets'],
      assets: ASSETS,
      onDeleteVariable: vi.fn(),
      nodeActions: ({ section: rowSection, node }, { defaultActions }) =>
        rowSection === 'assets' && node.segments.length === 1
          ? [
              ...defaultActions,
              {
                id: 'open-asset',
                icon: <svg />,
                label: `Open ${node.key}`,
                onSelect: () => openAsset(node.key),
              },
            ]
          : undefined,
    });

    await user.click(screen.getByRole('button', { name: 'Open invoiceApiKey' }));
    expect(openAsset).toHaveBeenCalledWith('invoiceApiKey');
    expect(screen.getByRole('button', { name: 'Delete invoiceApiKey' })).toBeInTheDocument();
  });

  it('leaves out edit, delete, and copy where the host says a row has none', () => {
    renderPanel({
      expandedSections: ['variables'],
      onRequestEditVariable: vi.fn(),
      onDeleteVariable: vi.fn(),
      canEdit: ({ node }) => node.key !== 'flowTest',
      canDelete: ({ node }) => node.key !== 'flowConfig',
      canCopy: ({ node }) => node.key !== 'flowTest',
    });

    expect(screen.queryByRole('button', { name: 'Edit flowTest' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete flowTest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit flowConfig' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete flowConfig' })).toBeNull();
    // Without copy, the name is plain text and the value has no copy action.
    expect(screen.queryByRole('button', { name: 'Copy path for $vars.flowTest' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy value of flowTest' })).toBeNull();
    expect(screen.getByText('flowTest')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Copy path for $vars.flowConfig' })
    ).toBeInTheDocument();
  });

  it('keeps a disabled header + focusable, and ignores clicks on it', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderPanel({
      assets: ASSETS,
      onAdd,
      addState: {
        assets: { disabled: true, tooltip: 'Add the process to a solution to select assets' },
      },
    });

    const add = screen.getByRole('button', { name: 'Add asset' });
    expect(add).toHaveAttribute('aria-disabled', 'true');
    // Still focusable, so keyboard users reach the reason in its tooltip.
    act(() => add.focus());
    expect(add).toHaveFocus();
    await user.click(add);
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Add variables' })).not.toHaveAttribute(
      'aria-disabled'
    );
  });

  it('reveals a row by reference, opening its section and parents and highlighting it', () => {
    const ref = createRef<NodeVariablesPanelHandle>();
    render(<NodeVariablesPanel ref={ref} inputs={INPUTS} variables={VARIABLES} nodes={NODES} />);
    const reference = '$vars.messageReceivedInSlack1.output.event.event_ts';
    expect(screen.queryByText('event_ts')).toBeNull();

    let revealed = false;
    act(() => {
      revealed = ref.current?.revealPath(reference) ?? false;
    });

    expect(revealed).toBe(true);
    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'true');
    const row = screen
      .getAllByRole('row')
      .find((element) => element.dataset.reference === reference);
    expect(row).toHaveAttribute('data-revealed');
    expect(ref.current?.revealPath('$vars.missing')).toBe(false);
  });

  it('clears a search that hides the revealed row, and reports the section it opens', async () => {
    const user = userEvent.setup();
    const ref = createRef<NodeVariablesPanelHandle>();
    const onExpandedSectionsChange = vi.fn();
    render(
      <NodeVariablesPanel
        ref={ref}
        variables={VARIABLES}
        nodes={NODES}
        expandedSections={['nodes']}
        onExpandedSectionsChange={onExpandedSectionsChange}
      />
    );
    await openSearch(user, 'autonomous');

    act(() => {
      ref.current?.revealPath('$vars.flowTest');
    });

    expect(screen.queryByDisplayValue('autonomous')).toBeNull();
    expect(onExpandedSectionsChange).toHaveBeenCalledWith(['variables', 'nodes']);
  });

  it('reopens a section closed during a search when revealing a row that matches it', async () => {
    const user = userEvent.setup();
    const ref = createRef<NodeVariablesPanelHandle>();
    render(<NodeVariablesPanel ref={ref} variables={VARIABLES} nodes={NODES} />);
    await openSearch(user, 'region');
    await user.click(screen.getByRole('button', { name: 'Collapse flowConfig' }));
    await user.click(sectionToggle('Variables'));

    act(() => {
      ref.current?.revealPath('$vars.flowConfig.region');
    });

    // The search stays, and the section and its row open again within it.
    expect(screen.getByDisplayValue('region')).toBeInTheDocument();
    expect(sectionToggle('Variables')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('region')).toBeInTheDocument();
  });

  it('keeps the default copy for an undefined override', () => {
    renderPanel({ strings: { sectionVariables: undefined, variablesCount: undefined } });

    expect(section('Variables')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Variables: 3' })).toBeInTheDocument();
  });

  it("takes overrides for the panel's copy and its trees'", () => {
    renderPanel({
      strings: { sectionVariables: 'Globals', variablesCount: (count) => `${count} globals` },
      treeStrings: { expandAll: 'Open everything' },
    });

    expect(section('Globals')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 globals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open everything' })).toBeInTheDocument();
  });
});
