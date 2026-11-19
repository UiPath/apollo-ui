import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

type Action = DecisionGraphAction<string, string>;

const withReference = (present: boolean): DecisionGraphNode[] => [
  { kind: 'decision', id: 'other', label: 'Other', logic: { kind: 'other' }, children: [] },
  {
    kind: 'decision',
    id: 'pricing',
    label: 'Pricing',
    logic: { kind: 'other' },
    children: [
      ...(present
        ? [{ kind: 'reference' as const, id: 'pr', label: 'Risk', targetId: 'risk' }]
        : []),
      { kind: 'decision', id: 'fee', label: 'Fee', logic: { kind: 'other' }, children: [] },
    ],
  },
  { kind: 'decision', id: 'risk', label: 'Risk', logic: { kind: 'other' }, children: [] },
];

const graph = (actions: readonly Action[], nodes: readonly DecisionGraphNode[]) => (
  <DecisionGraphText
    citations={{ kind: 'none' }}
    nodes={nodes}
    mode={{
      kind: 'edit',
      selected: null,
      onReveal: () => {},
      edit: { actions, wordRefusal: (refusal) => `Refused: ${refusal}` },
    }}
    renderBody={() => null}
    dataTestId="graph"
  />
);

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('focus lost from a reference', () => {
  it('does not jump to a decision focused before the reference when the host drops the reference', async () => {
    const actions: Action[] = [{ kind: 'move', onMove: vi.fn() }];
    const { rerender } = render(graph(actions, withReference(true)));
    screen.getByTestId('graph-toggle-other').focus();
    screen.getByTestId('graph-reference-link-pr').focus();
    rerender(graph(actions, withReference(false)));
    expect(document.activeElement?.getAttribute('data-testid')).not.toBe('graph-toggle-other');
  });

  it('does not jump to a decision focused before the reference menu when the host drops the reference', async () => {
    const actions: Action[] = [{ kind: 'move', onMove: vi.fn() }];
    const { rerender } = render(graph(actions, withReference(true)));
    screen.getByTestId('graph-toggle-other').focus();
    await userEvent.tab();
    const trigger = screen
      .getByTestId('graph-reference-pr')
      .querySelector<HTMLElement>('[data-graph-menu] button');
    trigger?.focus();
    expect(trigger).toHaveFocus();
    rerender(graph(actions, withReference(false)));
    expect(document.activeElement?.getAttribute('data-testid')).not.toBe('graph-toggle-other');
  });
});
