import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { SHARED_DEPENDENCY } from './__fixtures__/decisionGraph.fixtures';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { EditableDecisionGraphText } from './EditableDecisionGraphText';

type Action = DecisionGraphAction<string, string>;

const graph = (actions: readonly Action[], nodes: readonly DecisionGraphNode[]) => (
  <EditableDecisionGraphText
    nodes={nodes}
    mode={{ kind: 'edit', edit: { actions, wordRefusal: (refusal) => `Refused: ${refusal}` } }}
    renderBody={() => null}
    dataTestId="graph"
  />
);

const leaf = (id: string, label: string): DecisionGraphNode => ({
  kind: 'decision',
  id,
  label,
  logic: { kind: 'other' },
  children: [],
});

const focusedId = () =>
  document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName;

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

const laterHost = (
  start: readonly DecisionGraphNode[],
  after: readonly DecisionGraphNode[],
  kind: 'move' | 'delete'
) => {
  const handle = { apply: () => {} };
  const Host = () => {
    const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>(start);
    const action: Action =
      kind === 'move'
        ? {
            kind: 'move',
            onMove: () => {
              handle.apply = () => setNodes(after);
            },
          }
        : {
            kind: 'delete',
            onDelete: () => {
              handle.apply = () => setNodes(after);
            },
          };
    return graph([action], nodes);
  };
  return { Host, handle };
};

describe('host acts later', () => {
  it('moves focus to the next heading when the host deletes the decision after returning', async () => {
    const start = [leaf('a', 'A'), leaf('b', 'B')];
    const { Host, handle } = laterHost(start, [leaf('b', 'B')], 'delete');
    render(<Host />);
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{Delete}');
    await userEvent.click(await screen.findByTestId('graph-delete-dialog-confirm'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(focusedId()).toBe('graph-toggle-a');
    act(() => handle.apply());
    expect(focusedId()).toBe('graph-toggle-b');
  });
});

describe('per-render cost', () => {
  it('asks the host for logic options only when a menu opens, when another action already gives the card a menu', () => {
    const logicOptions = vi.fn(() => [{ logic: 'literal', label: 'Literal expression' }]);
    const { rerender } = render(
      graph(
        [
          { kind: 'rename', onRename: vi.fn() },
          { kind: 'changeLogic', logicOptions, onChangeLogic: vi.fn() },
        ],
        SHARED_DEPENDENCY.nodes
      )
    );
    rerender(
      graph(
        [
          { kind: 'rename', onRename: vi.fn() },
          { kind: 'changeLogic', logicOptions, onChangeLogic: vi.fn() },
        ],
        SHARED_DEPENDENCY.nodes
      )
    );
    expect(logicOptions).toHaveBeenCalledTimes(0);
  });

  it('does not grow host logic-option calls with the number of cards on a re-render, when another action already gives the card a menu', () => {
    const logicOptions = vi.fn(() => [{ logic: 'literal', label: 'Literal expression' }]);
    const many = Array.from({ length: 200 }, (_, index) => leaf(`d${index}`, `D${index}`));
    const view = () =>
      graph(
        [
          { kind: 'rename', onRename: vi.fn() },
          { kind: 'changeLogic', logicOptions, onChangeLogic: vi.fn() },
        ],
        many
      );
    const { rerender } = render(view());
    logicOptions.mockClear();
    rerender(view());
    expect(logicOptions.mock.calls.length).toBeLessThan(200);
  });
});
