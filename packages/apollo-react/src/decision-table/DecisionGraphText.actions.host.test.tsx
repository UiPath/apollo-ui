import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

type Action = DecisionGraphAction<string, string>;

const graph = (
  actions: readonly Action[],
  nodes: readonly DecisionGraphNode[],
  renderBody: (id: string) => React.ReactNode = () => null
) => (
  <DecisionGraphText
    nodes={nodes}
    mode={{
      kind: 'edit',
      selected: null,
      onReveal: () => {},
      edit: { actions, wordRefusal: (refusal) => `Refused: ${refusal}` },
    }}
    renderBody={renderBody}
    dataTestId="graph"
  />
);

const decision = (
  id: string,
  label: string,
  children: DecisionGraphNode[] = []
): DecisionGraphNode => ({ kind: 'decision', id, label, logic: { kind: 'other' }, children });

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('links dialog while the host changes the links', () => {
  it('does not write back the links the dialog opened with after the host added one', async () => {
    const onChooseInputs = vi.fn();
    const handle = { addInput: () => {} };
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>([
        decision('a', 'A', [decision('b', 'B')]),
        decision('c', 'C'),
      ]);
      handle.addInput = () =>
        setNodes([decision('a', 'A', [decision('b', 'B'), decision('c', 'C')])]);
      return graph([{ kind: 'chooseInputs', onChooseInputs }], nodes);
    };
    render(<Host />);
    await userEvent.click(screen.getByTestId('graph-menu-a'));
    await userEvent.click(await screen.findByText('Choose inputs'));
    await screen.findByTestId('graph-links-dialog');
    act(() => handle.addInput());
    expect(screen.getByTestId('graph-links-dialog-option-c')).toBeChecked();
  });

  it('does not propose dropping a link the host added while the dialog was open, on an untouched save', async () => {
    const onChooseInputs = vi.fn();
    const handle = { addInput: () => {} };
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>([
        decision('a', 'A', [decision('b', 'B')]),
        decision('c', 'C'),
      ]);
      handle.addInput = () =>
        setNodes([decision('a', 'A', [decision('b', 'B'), decision('c', 'C')])]);
      return graph([{ kind: 'chooseInputs', onChooseInputs }], nodes);
    };
    render(<Host />);
    await userEvent.click(screen.getByTestId('graph-menu-a'));
    await userEvent.click(await screen.findByText('Choose inputs'));
    await screen.findByTestId('graph-links-dialog');
    act(() => handle.addInput());
    await userEvent.click(screen.getByTestId('graph-links-dialog-save'));
    expect(onChooseInputs).not.toHaveBeenCalledWith('a', ['b']);
  });
});

describe('delete dialog users', () => {
  it('lists two users that share a name without a React key clash', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      graph(
        [{ kind: 'delete', onDelete: vi.fn() }],
        [
          decision('p1', 'Same', [decision('x', 'X')]),
          decision('p2', 'Same', [{ kind: 'reference', id: 'r', label: 'X', targetId: 'x' }]),
        ]
      )
    );
    screen.getByTestId('graph-toggle-x').focus();
    await userEvent.keyboard('{Delete}');
    const users = await screen.findByTestId('graph-delete-dialog-users');
    expect(users.querySelectorAll('li')).toHaveLength(2);
    const clash = error.mock.calls.some((call) =>
      call.some((part) => typeof part === 'string' && part.includes('same key'))
    );
    error.mockRestore();
    expect(clash).toBe(false);
  });
});

describe('menus with nothing to pick', () => {
  it('offers at least one item it can pick when the only decision shows a menu for moves alone', async () => {
    render(graph([{ kind: 'move', onMove: vi.fn() }], [decision('a', 'A')]));
    const button = screen.queryByTestId('graph-menu-a');
    if (button === null) return;
    await userEvent.click(button);
    const items = await screen.findAllByRole('menuitem');
    expect(items.some((item) => item.getAttribute('aria-disabled') !== 'true')).toBe(true);
  });
});

describe('refused rename then blur', () => {
  it('does not propose the refused name to the host a second time when focus leaves untouched', async () => {
    const onRename = vi.fn(() => 'duplicateName');
    render(graph([{ kind: 'rename', onRename }], [decision('a', 'A'), decision('b', 'B')]));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    const input = await screen.findByTestId('graph-name-a-input');
    await userEvent.clear(input);
    await userEvent.type(input, 'B{Enter}');
    expect(onRename).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByTestId('graph-toggle-b'));
    expect(onRename).toHaveBeenCalledTimes(1);
  });
});
