import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

type Action = DecisionGraphAction<string, string>;

const graph = (actions: readonly Action[], nodes: readonly DecisionGraphNode[]) => (
  <DecisionGraphText
    nodes={nodes}
    mode={{
      kind: 'edit',
      selected: null,
      onReveal: () => {},
      edit: { actions, wordRefusal: (refusal) => `Refused: ${refusal}` },
    }}
    renderBody={() => ({ kind: 'other', content: null })}
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

const NODES = [leaf('a', 'A'), leaf('b', 'B')];
const move: Action = { kind: 'move', onMove: () => {} };

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('host withdraws the action of an open surface', () => {
  it('closes the delete dialog once the host no longer offers delete', async () => {
    const onDelete = vi.fn();
    const { rerender } = render(graph([{ kind: 'delete', onDelete }, move], NODES));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{Delete}');
    expect(await screen.findByTestId('graph-delete-dialog')).toBeTruthy();
    rerender(graph([move], NODES));
    const confirm = screen.queryByTestId('graph-delete-dialog-confirm');
    if (confirm) await userEvent.click(confirm);
    expect(screen.queryByTestId('graph-delete-dialog')).toBeNull();
  });

  it('does not reopen a withdrawn rename field when the host offers rename again', async () => {
    const rename: Action = { kind: 'rename', onRename: () => {} };
    const { rerender } = render(graph([rename, move], NODES));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    expect(screen.getByTestId('graph-name-a-input')).toBeTruthy();
    rerender(graph([move], NODES));
    expect(screen.queryByTestId('graph-name-a-input')).toBeNull();
    screen.getByTestId('graph-toggle-b').focus();
    act(() => {
      rerender(graph([rename, move], NODES));
    });
    expect(screen.queryByTestId('graph-name-a-input')).toBeNull();
    expect(document.activeElement?.getAttribute('data-testid')).toBe('graph-toggle-b');
  });
  it('keeps focus where the user put it when rename is offered again', async () => {
    const rename: Action = { kind: 'rename', onRename: () => {} };
    const { rerender } = render(graph([rename, move], NODES));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    rerender(graph([move], NODES));
    screen.getByTestId('graph-toggle-b').focus();
    act(() => {
      rerender(graph([rename, move], NODES));
    });
    expect(document.activeElement?.getAttribute('data-testid')).toBe('graph-toggle-b');
  });
});
