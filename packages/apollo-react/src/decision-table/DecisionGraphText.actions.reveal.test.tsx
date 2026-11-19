import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo, useState } from 'react';
import { type Mock, vi } from 'vitest';
import {
  fixtureActions,
  graphOf,
  nodesOf,
  wordFixtureRefusal,
} from './__fixtures__/graphActionsHost';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

const other = (id: string): DecisionGraphNode => ({
  kind: 'decision',
  id,
  label: id,
  logic: { kind: 'other' },
  children: [],
});
const NODES = [other('a'), other('b'), other('c')];
const NEAREST = { block: 'nearest', inline: 'nearest' };

const Host = () => {
  const [model, setModel] = useState(() => graphOf(NODES));
  const nodes = useMemo(() => nodesOf(model), [model]);
  return (
    <DecisionGraphText
      nodes={nodes}
      mode={{
        kind: 'edit',
        selected: null,
        onReveal: () => {},
        edit: { actions: fixtureActions(model, setModel), wordRefusal: wordFixtureRefusal },
      }}
      renderBody={() => ({ kind: 'other', content: null })}
      dataTestId="graph"
    />
  );
};

const toggle = (id: string) => screen.getByTestId(`graph-toggle-${id}`);
const order = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-graph-card]')).map(
    (card) => card.dataset.decisionId
  );

let scrollIntoView: Mock<Element['scrollIntoView']>;
beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
  scrollIntoView = vi.fn<Element['scrollIntoView']>();
  Element.prototype.scrollIntoView = scrollIntoView;
});

const revealed = () => ({
  order: order(),
  focused: document.activeElement === toggle('b'),
  reveals: scrollIntoView.mock.contexts.filter((element) => element === toggle('b')).length,
});

describe('focus handed back after a graph action', () => {
  it('scrolls the moved heading into view after a move by key', async () => {
    render(<Host />);
    toggle('b').focus();
    await userEvent.keyboard('{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
    expect(revealed()).toEqual({ order: ['a', 'c', 'b'], focused: true, reveals: 1 });
    expect(scrollIntoView).toHaveBeenLastCalledWith(NEAREST);
  });

  it('scrolls the moved heading into view after a move picked from the menu by key', async () => {
    render(<Host />);
    screen.getByTestId('graph-menu-b').focus();
    await userEvent.keyboard('{Enter}');
    (await screen.findByRole('menuitem', { name: /Move down/ })).focus();
    await userEvent.keyboard('{Enter}');
    expect(revealed()).toEqual({ order: ['a', 'c', 'b'], focused: true, reveals: 1 });
  });

  it('scrolls the heading into view after a decision added from the menu by key', async () => {
    render(<Host />);
    screen.getByTestId('graph-menu-b').focus();
    await userEvent.keyboard('{Enter}');
    (await screen.findByRole('menuitem', { name: 'Add decision after' })).focus();
    await userEvent.keyboard('{Enter}');
    expect(revealed()).toEqual({ order: ['a', 'b', 'new-1', 'c'], focused: true, reveals: 1 });
  });

  it('leaves the scroll alone after a move picked from the menu by pointer', async () => {
    render(<Host />);
    await userEvent.click(screen.getByTestId('graph-menu-b'));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Move down/ }));
    expect(revealed()).toEqual({ order: ['a', 'c', 'b'], focused: true, reveals: 0 });
  });
});
