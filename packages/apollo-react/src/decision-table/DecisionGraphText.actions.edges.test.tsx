import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { vi } from 'vitest';
import { SHARED_DEPENDENCY } from './__fixtures__/decisionGraph.fixtures';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

type Action = DecisionGraphAction<string, string>;
const NODES = SHARED_DEPENDENCY.nodes;

const graph = (
  actions: readonly Action[],
  nodes: readonly DecisionGraphNode[] = NODES,
  onOpenDecision: ((id: string) => void) | undefined = undefined
) => (
  <DecisionGraphText
    nodes={nodes}
    mode={{
      kind: 'edit',
      selected: null,
      onReveal: () => {},
      edit: { actions, wordRefusal: (refusal) => `Refused: ${refusal}` },
    }}
    renderBody={() => ({ kind: 'other', content: null })}
    onOpenDecision={onOpenDecision}
    dataTestId="graph"
  />
);
const toggle = (id: string) => screen.getByTestId(`graph-toggle-${id}`);
const focusedId = () =>
  document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName;
const other = (id: string, children: DecisionGraphNode[] = []): DecisionGraphNode => ({
  kind: 'decision',
  id,
  label: id,
  logic: { kind: 'other' },
  children,
});

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('double-click inside the menu', () => {
  it('does not open the decision when a disabled card menu item is double-clicked', async () => {
    const onOpen = vi.fn();
    render(graph([{ kind: 'move', onMove: vi.fn() }], NODES, onOpen));
    await userEvent.click(screen.getByTestId('graph-menu-risk'));
    const item = await screen.findByRole('menuitem', { name: /Move up/ });
    await userEvent.dblClick(item);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not open the decision when the open card menu panel is double-clicked', async () => {
    const onOpen = vi.fn();
    render(graph([{ kind: 'move', onMove: vi.fn() }], NODES, onOpen));
    await userEvent.click(screen.getByTestId('graph-menu-risk'));
    await userEvent.dblClick(await screen.findByRole('menu'));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not open the decision when a disabled reference menu item is double-clicked', async () => {
    const onOpen = vi.fn();
    const nodes = [
      other('pricing', [
        { kind: 'reference', id: 'pr', label: 'risk', targetId: 'risk' },
        other('fee'),
      ]),
      other('risk'),
    ];
    render(graph([{ kind: 'move', onMove: vi.fn() }], nodes, onOpen));
    await userEvent.click(screen.getByTestId('graph-reference-menu-pr'));
    const item = await screen.findByRole('menuitem', { name: /Move up/ });
    await userEvent.dblClick(item);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe('focus after delete', () => {
  it('moves focus to the reference that takes the deleted card place, not its full card elsewhere', async () => {
    const start = [
      other('pricing', [
        other('fee'),
        { kind: 'reference', id: 'pr', label: 'risk', targetId: 'risk' },
      ]),
      other('risk'),
    ];
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>(start);
      return graph(
        [
          {
            kind: 'delete',
            onDelete: () =>
              setNodes([
                other('pricing', [
                  { kind: 'reference', id: 'pr', label: 'risk', targetId: 'risk' },
                ]),
                other('risk'),
              ]),
          },
        ],
        nodes
      );
    };
    render(<Host />);
    toggle('fee').focus();
    await userEvent.keyboard('{Delete}');
    await userEvent.click(await screen.findByTestId('graph-delete-dialog-confirm'));
    expect(focusedId()).toBe('graph-reference-link-pr');
  });

  it('keeps focus in the graph when the only decision is deleted', async () => {
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>([other('solo')]);
      return graph(
        [
          { kind: 'delete', onDelete: () => setNodes([]) },
          { kind: 'add', onAdd: vi.fn() },
        ],
        nodes
      );
    };
    render(<Host />);
    toggle('solo').focus();
    await userEvent.keyboard('{Delete}');
    await userEvent.click(await screen.findByTestId('graph-delete-dialog-confirm'));
    expect(focusedId()).not.toBe('BODY');
  });
});

describe('dialogs and a11y', () => {
  it('has no axe violations with a refused rename open', async () => {
    const { container } = render(graph([{ kind: 'rename', onRename: () => 'taken' }]));
    toggle('risk').focus();
    await userEvent.keyboard('{F2}Pricing{Enter}');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('survives the mode flipping to read while the delete dialog is open', async () => {
    const Host = () => {
      const [read, setRead] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setRead(true)}>
            flip
          </button>
          {read ? (
            <DecisionGraphText
              nodes={NODES}
              mode={{ kind: 'read', selected: null }}
              renderBody={() => ({ kind: 'other', content: null })}
              dataTestId="graph"
            />
          ) : (
            graph([{ kind: 'delete', onDelete: vi.fn() }])
          )}
        </>
      );
    };
    render(<Host />);
    toggle('risk').focus();
    await userEvent.keyboard('{Delete}');
    expect(await screen.findByTestId('graph-delete-dialog')).toBeInTheDocument();
    act(() => screen.getByText('flip').click());
    expect(screen.queryByTestId('graph-delete-dialog')).toBeNull();
  });
});
