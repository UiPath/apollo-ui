import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
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

const leaf = (
  id: string,
  label: string,
  children: DecisionGraphNode[] = []
): DecisionGraphNode => ({
  kind: 'decision',
  id,
  label,
  logic: { kind: 'other' },
  children,
});

const focusedId = () =>
  document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName;

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('menu agreement', () => {
  it('shows no menu button when the host offers no other logic for a decision', async () => {
    render(
      graph(
        [{ kind: 'changeLogic', logicOptions: () => [], onChangeLogic: vi.fn() }],
        [leaf('a', 'A')]
      )
    );
    const button = screen.queryByTestId('graph-menu-a');
    if (button) {
      await userEvent.click(button);
      const menu = await screen.findByRole('menu');
      expect(menu.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0);
    }
    expect(button).toBeNull();
  });
});

describe('host acts later', () => {
  it('keeps focus on a top-level heading the host moves down after returning', async () => {
    let apply: () => void = () => {};
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>([
        leaf('a', 'A'),
        leaf('b', 'B'),
      ]);
      return graph(
        [
          {
            kind: 'move',
            onMove: () => {
              apply = () => setNodes([leaf('b', 'B'), leaf('a', 'A')]);
            },
          },
        ],
        nodes
      );
    };
    render(<Host />);
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
    expect(screen.getByTestId('graph-toggle-a')).toHaveFocus();
    act(() => apply());
    expect(focusedId()).toBe('graph-toggle-a');
  });

  it('keeps the typed name when the host remounts the card being renamed', async () => {
    let apply: () => void = () => {};
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>([
        leaf('p', 'P'),
        leaf('a', 'A'),
      ]);
      apply = () => setNodes([leaf('p', 'P', [leaf('a', 'A')])]);
      return graph([{ kind: 'rename', onRename: vi.fn() }], nodes);
    };
    render(<Host />);
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    await userEvent.keyboard('Draft');
    expect(screen.getByTestId('graph-name-a-input')).toHaveValue('Draft');
    act(() => apply());
    expect(screen.getByTestId('graph-name-a-input')).toHaveValue('Draft');
  });
});
