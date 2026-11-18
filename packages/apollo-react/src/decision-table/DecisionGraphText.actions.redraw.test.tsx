import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import {
  type FixtureGraph,
  fixtureActions,
  graphOf,
  nodesOf,
  wordFixtureRefusal,
} from './__fixtures__/graphActionsHost';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { EditableDecisionGraphText } from './EditableDecisionGraphText';

const leaf = (
  id: string,
  label: string,
  children: DecisionGraphNode[] = []
): DecisionGraphNode => ({ kind: 'decision', id, label, logic: { kind: 'other' }, children });

const ref = (id: string, targetId: string, label: string): DecisionGraphNode => ({
  kind: 'reference',
  id,
  label,
  targetId,
});

const START = graphOf([leaf('p', 'P', [leaf('a', 'A', [leaf('d', 'D')]), ref('p-d', 'd', 'D')])]);

const Host = ({ initial }: { initial: FixtureGraph }) => {
  const [graph, setGraph] = useState(initial);
  return (
    <EditableDecisionGraphText
      nodes={nodesOf(graph)}
      mode={{
        kind: 'edit',
        edit: { actions: fixtureActions(graph, setGraph), wordRefusal: wordFixtureRefusal },
      }}
      renderBody={() => null}
      dataTestId="graph"
    />
  );
};

const focused = () =>
  document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName;

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('focus across a decision drawn in full or as a reference', () => {
  it('keeps focus on a reference moved up above the card that drew it, where it is now drawn in full', async () => {
    render(<Host initial={START} />);
    screen.getByTestId('graph-reference-link-p-d').focus();
    await userEvent.keyboard('{Alt>}{Shift>}{ArrowUp}{/Shift}{/Alt}');
    expect(screen.getByTestId('graph-toggle-d')).toBeInTheDocument();
    expect(focused()).toBe('graph-toggle-d');
  });

  it('moves focus to the decision a deleted card left behind when its neighbour reference is now drawn in full', async () => {
    render(<Host initial={START} />);
    await userEvent.click(screen.getByTestId('graph-menu-a'));
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Delete/ }));
    await userEvent.click(await screen.findByTestId('graph-delete-dialog-confirm'));
    expect(screen.queryByTestId('graph-toggle-a')).toBeNull();
    expect(screen.getByTestId('graph-toggle-d')).toBeInTheDocument();
    expect(focused()).toBe('graph-toggle-d');
  });
});

describe('rename while the host changes the name', () => {
  it('does not write the old name back when focus leaves an untouched field', async () => {
    const onRename = vi.fn();
    const actions: DecisionGraphAction<string, string>[] = [{ kind: 'rename', onRename }];
    const view = (label: string) => (
      <EditableDecisionGraphText
        nodes={[leaf('a', label)]}
        mode={{ kind: 'edit', edit: { actions, wordRefusal: (r) => r } }}
        renderBody={() => null}
        dataTestId="graph"
      />
    );
    const { rerender } = render(view('Risk'));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    const input = screen.getByTestId('graph-name-a-input');
    expect(input).toHaveFocus();
    rerender(view('Risk score'));
    await userEvent.tab();
    expect(onRename).not.toHaveBeenCalled();
  });
});
