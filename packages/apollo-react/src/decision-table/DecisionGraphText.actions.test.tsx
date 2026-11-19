import { fireEvent, render, screen, within } from '@testing-library/react';
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
  onOpenDecision: ((decisionId: string) => void) | undefined = undefined
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
const openMenu = async (testId: string) => {
  await userEvent.click(screen.getByTestId(testId));
  return screen.findByRole('menu');
};
const pick = async (name: string | RegExp) =>
  userEvent.click(await screen.findByRole('menuitem', { name }));
const itemNames = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);
const press = async (id: string, keys: string) => {
  toggle(id).focus();
  await userEvent.keyboard(keys);
};
const PORTALLED = { rules: { region: { enabled: false } } };

const live = () => screen.getByTestId('graph-live');

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('DecisionGraphText actions', () => {
  it('shows no menu, keys or add button when read only', () => {
    render(
      <DecisionGraphText
        nodes={NODES}
        mode={{ kind: 'read', selected: null }}
        renderBody={() => ({ kind: 'other', content: null })}
        dataTestId="graph"
      />
    );
    expect(screen.queryByTestId('graph-menu-risk')).toBeNull();
    expect(screen.queryByTestId('graph-add-decision')).toBeNull();
    expect(toggle('risk')).not.toHaveAttribute('aria-keyshortcuts');
  });

  it('shows no menu when the host offers nothing a card can do', () => {
    render(
      graph(
        [{ kind: 'add', onAdd: vi.fn() }],
        [{ kind: 'reference', id: 'r', label: 'Risk', targetId: 'risk' }]
      )
    );
    expect(screen.queryByTestId('graph-reference-menu-r')).toBeNull();
    expect(screen.getByTestId('graph-add-decision')).toBeInTheDocument();
  });

  it('lists only the items whose callbacks the host passes', async () => {
    render(graph([{ kind: 'delete', onDelete: vi.fn() }]));
    expect(itemNames(await openMenu('graph-menu-risk'))).toEqual(['DeleteDelete']);
  });

  it('opens a decision from its menu', async () => {
    const onOpen = vi.fn();
    render(graph([], NODES, onOpen));
    await openMenu('graph-menu-risk');
    await pick('Open decision');
    expect(onOpen).toHaveBeenCalledWith('risk');
  });

  describe('rename', () => {
    it('proposes the new name on Enter and returns focus to the heading', async () => {
      const onRename = vi.fn();
      render(graph([{ kind: 'rename', onRename }]));
      await openMenu('graph-menu-risk');
      await pick(/Rename/);
      const input = screen.getByTestId('graph-name-risk-input');
      expect(input).toHaveFocus();
      await userEvent.keyboard('Credit risk{Enter}');
      expect(onRename).toHaveBeenCalledWith('risk', 'Credit risk');
      expect(screen.queryByTestId('graph-name-risk-input')).toBeNull();
      expect(toggle('risk')).toHaveFocus();
    });

    it('keeps the field open on the Enter that confirms an IME composition (Safari keyCode 229)', async () => {
      const onRename = vi.fn();
      render(graph([{ kind: 'rename', onRename }]));
      await press('risk', '{F2}');
      const input = screen.getByTestId('graph-name-risk-input');
      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
      expect(onRename).not.toHaveBeenCalled();
      expect(screen.getByTestId('graph-name-risk-input')).toBeInTheDocument();
    });

    it('keeps the field open with the refusal when the host refuses it', async () => {
      const onRename = vi.fn(() => 'taken');
      render(graph([{ kind: 'rename', onRename }]));
      await press('risk', '{F2}');
      await userEvent.keyboard('Pricing{Enter}');
      const input = screen.getByTestId('graph-name-risk-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Refused: taken');
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByTestId('graph-name-risk-input')).toBeNull();
      expect(toggle('risk')).toHaveFocus();
      expect(onRename).toHaveBeenCalledTimes(1);
    });

    it('commits on blur, announcing a refusal and closing', async () => {
      const onRename = vi.fn(() => 'taken');
      render(graph([{ kind: 'rename', onRename }]));
      await press('risk', '{F2}');
      await userEvent.keyboard('Pricing');
      await userEvent.click(document.body);
      expect(onRename).toHaveBeenCalledWith('risk', 'Pricing');
      expect(screen.queryByTestId('graph-name-risk-input')).toBeNull();
      expect(live()).toHaveTextContent('Refused: taken');
    });

    it('proposes nothing for an unchanged or empty name', async () => {
      const onRename = vi.fn();
      render(graph([{ kind: 'rename', onRename }]));
      await press('risk', '{F2}');
      await userEvent.keyboard('{Enter}');
      await press('risk', '{F2}');
      await userEvent.clear(screen.getByTestId('graph-name-risk-input'));
      await userEvent.keyboard('{Enter}');
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('confirms, listing the decisions that use it', async () => {
      const onDelete = vi.fn();
      render(graph([{ kind: 'delete', onDelete }]));
      await press('risk', '{Delete}');
      const dialog = await screen.findByTestId('graph-delete-dialog');
      expect(within(dialog).getByText('Delete Risk?')).toBeInTheDocument();
      expect(
        within(screen.getByTestId('graph-delete-dialog-users'))
          .getAllByRole('listitem')
          .map((item) => item.textContent)
      ).toEqual(['Eligibility', 'Pricing']);
      await userEvent.click(screen.getByTestId('graph-delete-dialog-confirm'));
      expect(onDelete).toHaveBeenCalledWith('risk');
    });

    it('bounds the list of users to the viewport so the buttons stay on screen', async () => {
      render(graph([{ kind: 'delete', onDelete: vi.fn() }]));
      await press('risk', '{Delete}');
      expect(await screen.findByTestId('graph-delete-dialog-users')).toHaveClass(
        'max-h-[40vh]',
        'overflow-y-auto'
      );
    });

    it('keeps the dialog open with the refusal', async () => {
      render(graph([{ kind: 'delete', onDelete: () => 'in use' }]));
      await press('risk', '{Delete}');
      await userEvent.click(await screen.findByTestId('graph-delete-dialog-confirm'));
      expect(
        within(screen.getByTestId('graph-delete-dialog')).getByRole('alert')
      ).toHaveTextContent('Refused: in use');
    });

    it('proposes nothing on cancel and returns focus to the heading', async () => {
      const onDelete = vi.fn();
      render(graph([{ kind: 'delete', onDelete }]));
      await press('risk', '{Delete}');
      await userEvent.click(await screen.findByTestId('graph-delete-dialog-cancel'));
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByTestId('graph-delete-dialog')).toBeNull();
      expect(toggle('risk')).toHaveFocus();
    });

    it('moves focus to the next heading once the host deletes it', async () => {
      const Host = () => {
        const [nodes, setNodes] = useState(NODES);
        return graph(
          [
            {
              kind: 'delete',
              onDelete: () =>
                setNodes(
                  NODES.map((node) =>
                    node.kind === 'decision' && node.id === 'eligibility'
                      ? { ...node, children: node.children.filter((child) => child.id !== 'risk') }
                      : node
                  )
                ),
            },
          ],
          nodes
        );
      };
      render(<Host />);
      await press('risk', '{Delete}');
      await userEvent.click(await screen.findByTestId('graph-delete-dialog-confirm'));
      expect(screen.queryByTestId('graph-decision-risk')).toBeNull();
      expect(toggle('net-income')).toHaveFocus();
    });
  });

  describe('add', () => {
    it.each([
      ['Add decision before', { kind: 'under', parentId: 'eligibility', index: 1 }],
      ['Add decision after', { kind: 'under', parentId: 'eligibility', index: 2 }],
      ['Add required input', { kind: 'under', parentId: 'net-income', index: 0 }],
    ] as const)('%s proposes its place', async (item, place) => {
      const onAdd = vi.fn();
      render(graph([{ kind: 'add', onAdd }]));
      await openMenu('graph-menu-net-income');
      await pick(item);
      expect(onAdd).toHaveBeenCalledWith(place);
    });

    it('adds a top-level decision after the last one', async () => {
      const onAdd = vi.fn();
      render(graph([{ kind: 'add', onAdd }]));
      await userEvent.click(screen.getByTestId('graph-add-decision'));
      expect(onAdd).toHaveBeenCalledWith({ kind: 'top', index: 2 });
    });

    it('offers the add button on an empty graph', () => {
      render(graph([{ kind: 'add', onAdd: vi.fn() }], []));
      expect(screen.getByTestId('graph-empty')).toBeInTheDocument();
      expect(screen.getByTestId('graph-add-decision')).toBeInTheDocument();
    });
  });

  describe('move', () => {
    it.each([
      [
        'eligibility',
        '{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}',
        {
          decisionId: 'eligibility',
          from: { kind: 'top', index: 0 },
          to: { kind: 'top', index: 1 },
        },
      ],
      [
        'net-income',
        '{Alt>}{Shift>}{ArrowUp}{/Shift}{/Alt}',
        {
          decisionId: 'net-income',
          from: { kind: 'under', parentId: 'eligibility', index: 1 },
          to: { kind: 'under', parentId: 'eligibility', index: 0 },
        },
      ],
      [
        'net-income',
        '{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}',
        {
          decisionId: 'net-income',
          from: { kind: 'under', parentId: 'eligibility', index: 1 },
          to: { kind: 'under', parentId: 'risk', index: 0 },
        },
      ],
      [
        'risk',
        '{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}',
        {
          decisionId: 'risk',
          from: { kind: 'under', parentId: 'eligibility', index: 0 },
          to: { kind: 'top', index: 1 },
        },
      ],
    ] as const)('moves %s from the keyboard', async (id, keys, move) => {
      const onMove = vi.fn();
      render(graph([{ kind: 'move', onMove }]));
      await press(id, keys);
      expect(onMove).toHaveBeenCalledWith(move);
      expect(toggle(id)).toHaveFocus();
    });

    it.each([
      ['eligibility', '{Alt>}{Shift>}{ArrowUp}{/Shift}{/Alt}'],
      ['pricing', '{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}'],
      ['eligibility', '{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}'],
      ['risk', '{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}'],
    ])('proposes nothing where %s cannot go', async (id, keys) => {
      const onMove = vi.fn();
      render(graph([{ kind: 'move', onMove }]));
      await press(id, keys);
      expect(onMove).not.toHaveBeenCalled();
    });

    it('disables the menu moves that cannot go and names the decisions they go under or out of', async () => {
      render(graph([{ kind: 'move', onMove: vi.fn() }]));
      const menu = await openMenu('graph-menu-net-income');
      expect(itemNames(menu)).toEqual([
        'Move upAlt+Shift+↑',
        'Move downAlt+Shift+↓',
        'Move under RiskAlt+Shift+→',
        'Move out of EligibilityAlt+Shift+←',
      ]);
      expect(within(menu).getByRole('menuitem', { name: /Move down/ })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });

    it('announces the host refusing a move and keeps focus on the heading', async () => {
      render(graph([{ kind: 'move', onMove: () => 'loop' }]));
      await press('eligibility', '{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
      expect(live()).toHaveTextContent('Refused: loop');
      expect(toggle('eligibility')).toHaveFocus();
    });

    it('moves a reference among its siblings from its menu', async () => {
      const onMove = vi.fn();
      const nodes: DecisionGraphNode[] = [
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
      render(graph([{ kind: 'move', onMove }], nodes));
      const menu = await openMenu('graph-reference-menu-pr');
      expect(itemNames(menu)).toEqual(['Move upAlt+Shift+↑', 'Move downAlt+Shift+↓']);
      await pick(/Move down/);
      expect(onMove).toHaveBeenCalledWith({
        decisionId: 'risk',
        from: { kind: 'under', parentId: 'pricing', index: 0 },
        to: { kind: 'under', parentId: 'pricing', index: 1 },
      });
    });
  });

  describe('links', () => {
    it('stops a reference using its decision', async () => {
      const onStopUsing = vi.fn();
      render(graph([{ kind: 'stopUsing', onStopUsing }]));
      await openMenu('graph-reference-menu-pricing-risk');
      await pick('Stop using in Pricing');
      expect(onStopUsing).toHaveBeenCalledWith('risk', 'pricing');
    });

    it('offers no stop using on a top-level decision', async () => {
      render(
        graph([
          { kind: 'stopUsing', onStopUsing: vi.fn() },
          { kind: 'delete', onDelete: vi.fn() },
        ])
      );
      expect(itemNames(await openMenu('graph-menu-pricing'))).toEqual(['DeleteDelete']);
    });

    it('bounds the list of choices to the viewport so the buttons stay on screen', async () => {
      render(graph([{ kind: 'chooseInputs', onChooseInputs: vi.fn() }]));
      await openMenu('graph-menu-eligibility');
      await pick('Choose inputs');
      const dialog = await screen.findByTestId('graph-links-dialog');
      expect(within(dialog).getByRole('list')).toHaveClass('max-h-[40vh]', 'overflow-y-auto');
    });

    it('chooses inputs, keeping the kept ones in order and adding the new ones after', async () => {
      const onChooseInputs = vi.fn();
      render(graph([{ kind: 'chooseInputs', onChooseInputs }]));
      await openMenu('graph-menu-eligibility');
      await pick('Choose inputs');
      const dialog = await screen.findByTestId('graph-links-dialog');
      expect(within(dialog).getByText('Inputs of Eligibility')).toBeInTheDocument();
      expect(screen.getByTestId('graph-links-dialog-option-risk')).toBeChecked();
      expect(screen.getByTestId('graph-links-dialog-option-net-income')).toBeChecked();
      expect(screen.getByTestId('graph-links-dialog-option-pricing')).not.toBeChecked();
      expect(screen.queryByTestId('graph-links-dialog-option-eligibility')).toBeNull();
      await userEvent.click(screen.getByTestId('graph-links-dialog-option-net-income'));
      await userEvent.click(screen.getByTestId('graph-links-dialog-option-pricing'));
      await userEvent.click(screen.getByTestId('graph-links-dialog-save'));
      expect(onChooseInputs).toHaveBeenCalledWith('eligibility', ['risk', 'pricing']);
      expect(screen.queryByTestId('graph-links-dialog')).toBeNull();
      expect(toggle('eligibility')).toHaveFocus();
    });

    it('chooses users, showing the host refusal and proposing nothing when unchanged', async () => {
      const onChooseUsers = vi.fn(() => 'loop');
      render(graph([{ kind: 'chooseUsers', onChooseUsers }]));
      await openMenu('graph-menu-risk');
      await pick('Choose users');
      expect(screen.getByTestId('graph-links-dialog-option-eligibility')).toBeChecked();
      expect(screen.getByTestId('graph-links-dialog-option-pricing')).toBeChecked();
      await userEvent.click(screen.getByTestId('graph-links-dialog-save'));
      expect(onChooseUsers).not.toHaveBeenCalled();
      await openMenu('graph-menu-risk');
      await pick('Choose users');
      await userEvent.click(screen.getByTestId('graph-links-dialog-option-net-income'));
      await userEvent.click(screen.getByTestId('graph-links-dialog-save'));
      expect(onChooseUsers).toHaveBeenCalledWith('risk', ['eligibility', 'pricing', 'net-income']);
      expect(within(screen.getByTestId('graph-links-dialog')).getByRole('alert')).toHaveTextContent(
        'Refused: loop'
      );
    });
  });

  it('changes logic to the kinds the host offers', async () => {
    const onChangeLogic = vi.fn();
    const logicOptions = vi.fn(() => [{ logic: 'literal', label: 'Literal expression' }]);
    render(graph([{ kind: 'changeLogic', logicOptions, onChangeLogic }]));
    await openMenu('graph-menu-risk');
    await pick('Change logic to Literal expression');
    expect(logicOptions).toHaveBeenCalledWith('risk');
    expect(onChangeLogic).toHaveBeenCalledWith('risk', 'literal');
  });

  it('adds a note once it has text', async () => {
    const onAddNote = vi.fn();
    render(graph([{ kind: 'addNote', onAddNote }]));
    await openMenu('graph-menu-risk');
    await pick('Add note');
    const save = await screen.findByTestId('graph-note-dialog-save');
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByTestId('graph-note-dialog-text'), '  Checked in March ');
    await userEvent.click(save);
    expect(onAddNote).toHaveBeenCalledWith('risk', 'Checked in March');
    expect(screen.queryByTestId('graph-note-dialog')).toBeNull();
  });

  it('lists the keys a heading answers to', () => {
    render(
      graph(
        [
          { kind: 'rename', onRename: vi.fn() },
          { kind: 'delete', onDelete: vi.fn() },
          { kind: 'move', onMove: vi.fn() },
        ],
        NODES,
        vi.fn()
      )
    );
    expect(toggle('risk')).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+Enter F2 Delete Alt+Shift+ArrowUp Alt+Shift+ArrowDown Alt+Shift+ArrowRight Alt+Shift+ArrowLeft'
    );
  });

  it('has no axe violations with every action, its menu open and a dialog open', async () => {
    const actions: Action[] = [
      { kind: 'rename', onRename: vi.fn() },
      { kind: 'delete', onDelete: vi.fn() },
      { kind: 'add', onAdd: vi.fn() },
      { kind: 'chooseInputs', onChooseInputs: vi.fn() },
      { kind: 'chooseUsers', onChooseUsers: vi.fn() },
      { kind: 'stopUsing', onStopUsing: vi.fn() },
      { kind: 'move', onMove: vi.fn() },
      { kind: 'addNote', onAddNote: vi.fn() },
    ];
    const { container } = render(graph(actions));
    expect(await axe(container)).toHaveNoViolations();
    expect(await axe(await openMenu('graph-menu-risk'), PORTALLED)).toHaveNoViolations();
    await pick('Choose inputs');
    expect(await axe(await screen.findByRole('dialog'), PORTALLED)).toHaveNoViolations();
    await userEvent.click(screen.getByTestId('graph-links-dialog-cancel'));
    await press('risk', '{Delete}');
    expect(await axe(await screen.findByRole('alertdialog'), PORTALLED)).toHaveNoViolations();
    await userEvent.click(screen.getByTestId('graph-delete-dialog-cancel'));
    await press('risk', '{F2}');
    expect(await axe(container)).toHaveNoViolations();
  });
});
