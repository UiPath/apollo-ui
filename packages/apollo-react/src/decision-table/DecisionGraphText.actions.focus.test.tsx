import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { SHARED_DEPENDENCY } from './__fixtures__/decisionGraph.fixtures';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

type Action = DecisionGraphAction<string, string>;
const NODES = SHARED_DEPENDENCY.nodes;

const graph = (actions: readonly Action[], nodes: readonly DecisionGraphNode[] = NODES) => (
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

const toggle = (id: string) => screen.getByTestId(`graph-toggle-${id}`);
const press = async (id: string, keys: string) => {
  toggle(id).focus();
  await userEvent.keyboard(keys);
};

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('rename', () => {
  it('lets Tab leave an unchanged rename field for the next control', async () => {
    render(graph([{ kind: 'rename', onRename: vi.fn() }]));
    await press('risk', '{F2}');
    expect(screen.getByTestId('graph-name-risk-input')).toHaveFocus();
    await userEvent.tab();
    expect(screen.queryByTestId('graph-name-risk-input')).toBeNull();
    expect(document.activeElement?.getAttribute('data-testid')).not.toBe('graph-toggle-risk');
  });

  it('lets a click on another heading keep focus when the name is unchanged', async () => {
    render(graph([{ kind: 'rename', onRename: vi.fn() }]));
    await press('risk', '{F2}');
    await userEvent.click(toggle('pricing'));
    expect(document.activeElement?.getAttribute('data-testid')).toBe('graph-toggle-pricing');
  });

  it('commits on blur after the host refused an Enter', async () => {
    const onRename = vi.fn(() => 'taken');
    render(graph([{ kind: 'rename', onRename }]));
    await press('risk', '{F2}');
    await userEvent.keyboard('Pricing{Enter}');
    expect(onRename).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Control>}a{/Control}Credit risk');
    await userEvent.click(document.body);
    expect({
      calls: onRename.mock.calls.length,
      fieldOpen: screen.queryByTestId('graph-name-risk-input') !== null,
    }).toEqual({ calls: 2, fieldOpen: false });
  });
});

const REFERENCE_NODES: DecisionGraphNode[] = [
  {
    kind: 'decision',
    id: 'pricing',
    label: 'Pricing',
    logic: { kind: 'other' },
    children: [
      { kind: 'reference', id: 'pr', label: 'Risk', targetId: 'risk' },
      { kind: 'decision', id: 'fee', label: 'Fee', logic: { kind: 'other' }, children: [] },
    ],
  },
  { kind: 'decision', id: 'risk', label: 'Risk', logic: { kind: 'other' }, children: [] },
];

describe('reference moves', () => {
  it('keeps focus on a reference moved by key', async () => {
    const onMove = vi.fn(() => 'nope');
    render(graph([{ kind: 'move', onMove }], REFERENCE_NODES));
    const chip = screen.getByTestId('graph-reference-link-pr');
    chip.focus();
    await userEvent.keyboard('{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
    expect(onMove).toHaveBeenCalled();
    expect(document.activeElement?.getAttribute('data-testid')).toBe('graph-reference-link-pr');
  });
});

describe('focus after menu items', () => {
  it('lands on the heading after changing logic, as the view asks', async () => {
    const onChangeLogic = vi.fn();
    render(
      graph([
        {
          kind: 'changeLogic',
          logicOptions: () => [{ logic: 'literal', label: 'Literal expression' }],
          onChangeLogic,
        },
      ])
    );
    await userEvent.click(screen.getByTestId('graph-menu-risk'));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Literal/ }));
    expect(onChangeLogic).toHaveBeenCalled();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(toggle('risk')).toHaveFocus();
  });
});

describe('host acts later', () => {
  it('keeps focus on a decision the host moves under another parent after returning', async () => {
    let apply: () => void = () => {};
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>(NODES);
      return graph(
        [
          {
            kind: 'move',
            onMove: () => {
              apply = () =>
                setNodes([
                  {
                    kind: 'decision',
                    id: 'eligibility',
                    label: 'Eligibility',
                    logic: { kind: 'other' },
                    children: [
                      {
                        kind: 'decision',
                        id: 'risk',
                        label: 'Risk',
                        logic: { kind: 'other' },
                        children: [],
                      },
                    ],
                  },
                  {
                    kind: 'decision',
                    id: 'pricing',
                    label: 'Pricing',
                    logic: { kind: 'other' },
                    children: [
                      {
                        kind: 'decision',
                        id: 'net-income',
                        label: 'Net income',
                        logic: { kind: 'other' },
                        children: [],
                      },
                    ],
                  },
                ]);
            },
          },
        ],
        nodes
      );
    };
    render(<Host />);
    await press('net-income', '{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}');
    expect(toggle('net-income')).toHaveFocus();
    act(() => apply());
    expect(
      document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName
    ).toBe('graph-toggle-net-income');
  });

  it('keeps focus on a decision the host moves synchronously under another parent', async () => {
    const Host = () => {
      const [nodes, setNodes] = useState<readonly DecisionGraphNode[]>(NODES);
      return graph(
        [
          {
            kind: 'move',
            onMove: () =>
              setNodes([
                {
                  kind: 'decision',
                  id: 'eligibility',
                  label: 'Eligibility',
                  logic: { kind: 'other' },
                  children: [
                    {
                      kind: 'decision',
                      id: 'risk',
                      label: 'Risk',
                      logic: { kind: 'other' },
                      children: [],
                    },
                  ],
                },
                {
                  kind: 'decision',
                  id: 'net-income',
                  label: 'Net income',
                  logic: { kind: 'other' },
                  children: [],
                },
                {
                  kind: 'decision',
                  id: 'pricing',
                  label: 'Pricing',
                  logic: { kind: 'other' },
                  children: [],
                },
              ]),
          },
        ],
        nodes
      );
    };
    render(<Host />);
    await press('net-income', '{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}');
    expect(toggle('net-income')).toHaveFocus();
  });
});
