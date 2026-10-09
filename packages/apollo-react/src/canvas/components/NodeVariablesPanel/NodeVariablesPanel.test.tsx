import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent, waitFor, within } from '../../utils/testing';
import type { JsonObject } from '../JsonTree';
import { NodeVariablesPanel } from './NodeVariablesPanel';
import type { NodeVariablesPanelProps, NodeVariablesSource } from './NodeVariablesPanel.types';

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
    <NodeVariablesPanel inputs={INPUTS} variables={VARIABLES} nodes={NODES} {...props} />
  );
}

const section = (name: string) => screen.getByRole('region', { name });
const sectionToggle = (name: string) => within(section(name)).getAllByRole('button')[0]!;

async function openSearch(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('button', { name: 'Search fields and values' }));
  await user.type(screen.getByRole('textbox', { name: 'Search variables' }), text);
}

describe('NodeVariablesPanel', () => {
  it('renders every section, with only Nodes open by default', () => {
    renderPanel();

    for (const name of ['Inputs', 'Outputs', 'Variables']) {
      expect(sectionToggle(name)).toHaveAttribute('aria-expanded', 'false');
    }
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Autonomous agent')).toBeInTheDocument();
    expect(screen.queryByText('HTTP webhook')).not.toBeInTheDocument();
  });

  it('honors defaultExpandedSections', () => {
    renderPanel({ defaultExpandedSections: ['inputs'] });

    expect(sectionToggle('Inputs')).toHaveAttribute('aria-expanded', 'true');
    expect(sectionToggle('Nodes')).toHaveAttribute('aria-expanded', 'false');
  });

  it('counts each section and describes counts for assistive technology', () => {
    renderPanel();

    expect(screen.getByRole('img', { name: '3 inputs' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '0 outputs' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 variables' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 node' })).toBeInTheDocument();
  });

  it('shows each node by name and icon, with its id as the copied reference', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderPanel({ defaultExpandedSections: ['inputs'], onCopy });

    expect(within(section('Inputs')).getByTestId('manual-icon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy path for $vars.manualTrigger1' }));

    await waitFor(() =>
      expect(onCopy).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'path', text: '$vars.manualTrigger1' })
      )
    );
  });

  it('shows the node id beside its name only while the row is hovered', () => {
    renderPanel({ defaultExpandedSections: ['inputs'] });

    // A node with no output yet names the node; it has no "= null" value.
    expect(within(section('Inputs')).queryByText('null')).toBeNull();

    expect(within(section('Inputs')).getByText('manualTrigger1')).toHaveClass(
      'hidden',
      'group-hover:block'
    );
  });

  it('builds node outputs from the schema and counts them on the node row', async () => {
    const user = userEvent.setup();
    renderPanel({ defaultExpandedSections: ['inputs', 'nodes'] });

    // The schema's top-level fields, or the consumer's outputCount.
    expect(screen.getAllByRole('img', { name: '1 output' })).toHaveLength(3);
    // Manual trigger has none, like the empty Outputs section.
    expect(screen.getAllByRole('img', { name: '0 outputs' })).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Expand messageReceivedInSlack1' }));
    await user.click(screen.getByRole('button', { name: 'Expand output' }));
    expect(screen.getByText('channel_name')).toBeInTheDocument();
  });

  it('focuses a node from its row, with Focus before the count and + last', async () => {
    const user = userEvent.setup();
    const onFocusNode = vi.fn();
    renderPanel({ onFocusNode, onAdd: vi.fn() });

    const focus = screen.getByRole('button', { name: 'Focus on Autonomous agent' });
    const count = within(section('Nodes')).getByRole('img', { name: '1 output' });
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
    renderPanel({ onAdd, defaultExpandedSections: ['inputs', 'nodes'] });

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
    renderPanel({ defaultExpandedSections: ['variables', 'inputs'], onCopy });

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
        defaultExpandedSections={['inputs']}
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
        defaultExpandedSections={['nodes']}
        nodes={[{ id: '__proto__', label: 'Proto node', outputCount: 1 }]}
      />
    );

    expect(screen.getByText('Proto node')).toBeInTheDocument();
  });

  it('uses each section metadata when a node is in Inputs and Nodes', () => {
    render(
      <NodeVariablesPanel
        defaultExpandedSections={['inputs', 'nodes']}
        inputs={[{ id: 'webhook1', label: 'Webhook (upstream)', outputCount: 2 }]}
        nodes={[{ id: 'webhook1', label: 'Webhook', outputCount: 1 }]}
      />
    );

    expect(within(section('Inputs')).getByText('Webhook (upstream)')).toBeInTheDocument();
    expect(within(section('Inputs')).getByRole('img', { name: '2 outputs' })).toBeInTheDocument();
    expect(within(section('Nodes')).getByText('Webhook')).toBeInTheDocument();
    expect(within(section('Nodes')).getByRole('img', { name: '1 output' })).toBeInTheDocument();
  });

  it('keeps expansion separate when the same node is in Inputs and Nodes', async () => {
    const user = userEvent.setup();
    const webhook = { id: 'webhook1', label: 'Webhook', value: { body: 'hi' } };
    render(
      <NodeVariablesPanel
        defaultExpandedSections={['inputs', 'nodes']}
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
        defaultExpandedSections={['nodes']}
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
        defaultExpandedSections={['outputs']}
        outputs={{ schema: { type: 'array', items: { type: 'string' } } }}
      />
    );

    expect(screen.getByRole('img', { name: '0 outputs' })).toBeInTheDocument();
    expect(within(section('Outputs')).getByText('item')).toBeInTheDocument();
  });

  it('applies pathForCopy to the prefixed reference', async () => {
    const user = userEvent.setup();
    renderPanel({ defaultExpandedSections: ['variables'], pathForCopy: (path) => `{{${path}}}` });

    await user.click(screen.getByRole('button', { name: 'Copy path for {{$vars.flowTest}}' }));

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe('{{$vars.flowTest}}')
    );
  });

  it('references flow outputs directly under the prefix', async () => {
    const user = userEvent.setup();
    renderPanel({
      defaultExpandedSections: ['outputs'],
      outputs: { value: { approvalStatus: 'approved' } },
    });

    await user.click(screen.getByRole('button', { name: 'Copy path for $vars.approvalStatus' }));

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe('$vars.approvalStatus')
    );
  });

  it('copies bare tree paths with an empty referencePrefix', async () => {
    const user = userEvent.setup();
    renderPanel({ defaultExpandedSections: ['variables'], referencePrefix: '' });

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
        defaultExpandedSections={['inputs']}
      />
    );

    // The Outputs section and the List input node both have no real entries.
    expect(screen.getAllByRole('img', { name: '0 outputs' })).toHaveLength(2);
    expect(screen.getByRole('img', { name: '0 variables' })).toBeInTheDocument();
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
        defaultExpandedSections={['variables']}
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

    expect(onEditVariable).toHaveBeenCalledWith('approved', {
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
    renderPanel({ defaultExpandedSections: ['variables'], onEditVariable });

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

    expect(onEditVariable).toHaveBeenCalledWith('flowTest', {
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
        defaultExpandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit approved' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    expect(within(dialog).getByRole('switch', { name: 'Default value' })).not.toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(onEditVariable).toHaveBeenCalledWith(
      'approved',
      expect.objectContaining({ type: 'boolean', defaultValue: undefined })
    );
  });

  it('saves an explicit false, and Clear returns a Boolean default to unset', async () => {
    const user = userEvent.setup();
    const onEditVariable = vi.fn();
    render(
      <NodeVariablesPanel
        variables={{ schema: { type: 'object', properties: { approved: { type: 'boolean' } } } }}
        defaultExpandedSections={['variables']}
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
      'approved',
      expect.objectContaining({ defaultValue: false })
    );

    await user.click(screen.getByRole('button', { name: 'Edit approved' }));
    const reopened = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(reopened).getByRole('switch', { name: 'Default value' }));
    await user.click(within(reopened).getByRole('button', { name: 'Clear default value' }));
    await user.click(within(reopened).getByRole('button', { name: 'Save' }));
    expect(onEditVariable).toHaveBeenLastCalledWith(
      'approved',
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
        defaultExpandedSections={['variables']}
        onEditVariable={onEditVariable}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variable' });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(onEditVariable).toHaveBeenCalledWith(
      'note',
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
        defaultExpandedSections={['variables']}
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
      'note',
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
        defaultExpandedSections={['variables']}
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
    renderPanel({ defaultExpandedSections: ['variables'], onEditVariable });

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
      'flowConfig',
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
          defaultExpandedSections={['variables']}
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
    renderPanel({ defaultExpandedSections: ['variables'], onDeleteVariable });

    await user.click(screen.getByRole('button', { name: 'Delete flowConfig' }));

    expect(onDeleteVariable).toHaveBeenCalledWith('flowConfig');
    // Nested fields aren't variables, so they have no delete action.
    await user.click(screen.getByRole('button', { name: 'Expand flowConfig' }));
    expect(screen.queryByRole('button', { name: 'Delete region' })).toBeNull();
  });

  it('offers no name-based actions for array items passed as variables', () => {
    render(
      <NodeVariablesPanel
        // Untyped consumers can still pass an array; its items aren't named variables.
        variables={{ value: ['a'] as unknown as JsonObject }}
        defaultExpandedSections={['variables']}
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

  it('narrows Inputs and Nodes to the selected node with the filter', async () => {
    const user = userEvent.setup();
    renderPanel({ selectedNodeId: 'httpWebhook1' });

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Selected node' }));

    await waitFor(() => expect(screen.getByText('HTTP webhook')).toBeInTheDocument());
    expect(screen.queryByText('Message received in Slack')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Variables' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Nodes' })).not.toBeInTheDocument();
  });

  it('keeps Expand all while the selected-node filter is on, expanding its containers', async () => {
    const user = userEvent.setup();
    renderPanel({ selectedNodeId: 'messageReceivedInSlack1' });

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
        defaultExpandedSections={['variables']}
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
      'toString',
      expect.objectContaining({ type: 'string', defaultValue: undefined })
    );
  });

  it('offers the selected-node filter only when a node is selected', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: 'Filter' })).toBeNull();
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

  it('leaves objects inside a root array alone with expand all', async () => {
    const user = userEvent.setup();
    render(<NodeVariablesPanel outputs={{ value: [{ region: 'us-east' }] }} />);

    await user.click(screen.getByRole('button', { name: 'Expand all' }));

    expect(sectionToggle('Outputs')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('region')).not.toBeInTheDocument();
  });

  it('offers Expand all, not Collapse all, when there is nothing to expand', () => {
    render(<NodeVariablesPanel />);

    expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument();
  });

  it('keeps containers that appear later collapsed by default', () => {
    const { rerender } = renderPanel({ defaultExpandedSections: ['variables'] });

    // Renaming the object variable introduces a new container path.
    rerender(
      <NodeVariablesPanel
        inputs={INPUTS}
        nodes={NODES}
        defaultExpandedSections={['variables']}
        variables={{ value: { flowTest: 'x', settings: { region: 'us-east' } } }}
      />
    );

    expect(screen.getByRole('button', { name: 'Expand settings' })).toBeInTheDocument();
    expect(screen.queryByText('region')).not.toBeInTheDocument();
  });

  it('pauses the section toggles while a search holds them open', async () => {
    const user = userEvent.setup();
    renderPanel();

    await openSearch(user, 'region');

    expect(sectionToggle('Variables')).toBeDisabled();
    // Matches are held open, so their row chevrons aren't controls either.
    expect(screen.getByRole('button', { name: 'Collapse flowConfig' })).toBeDisabled();
    // Expand/collapse all would have no visible effect, so it's hidden.
    expect(screen.queryByRole('button', { name: /^(Expand|Collapse) all$/ })).toBeNull();
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
    render(
      <NodeVariablesPanel defaultExpandedSections={['variables']} variables={{ value: many }} />
    );

    const rows = within(section('Variables')).queryAllByRole('button', { name: /^Copy path for/ });
    expect(rows.length).toBeLessThan(600);
  });

  it('renders small sections in full', () => {
    renderPanel({ defaultExpandedSections: ['variables'] });

    expect(
      within(section('Variables')).getAllByRole('button', { name: /^Copy path for/ })
    ).toHaveLength(3);
  });

  it('has no accessibility violations with every section open', async () => {
    const { container } = renderPanel({
      defaultExpandedSections: ['inputs', 'outputs', 'variables', 'nodes'],
      onAdd: vi.fn(),
      onFocusNode: vi.fn(),
      onEditVariable: vi.fn(),
      onDeleteVariable: vi.fn(),
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
