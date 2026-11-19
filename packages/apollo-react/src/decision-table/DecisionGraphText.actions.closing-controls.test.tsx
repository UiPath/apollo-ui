import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DecisionGraphAction, DecisionGraphMode } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';

type Action = DecisionGraphAction<string, string>;

const editMode = (actions: readonly Action[]): DecisionGraphMode<string, string> => ({
  kind: 'edit',
  selected: null,
  onReveal: () => {},
  edit: { actions, wordRefusal: (refusal) => `Refused: ${refusal}` },
});

const graph = (mode: DecisionGraphMode<string, string>, nodes: readonly DecisionGraphNode[]) => (
  <DecisionGraphText nodes={nodes} mode={mode} renderBody={() => null} dataTestId="graph" />
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
const rename: Action = { kind: 'rename', onRename: () => {} };
const note: Action = { kind: 'addNote', onAddNote: () => {} };

const activeTestId = () => document.activeElement?.getAttribute('data-testid') ?? null;

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('controls', () => {
  it('Escape in the rename field returns focus to the heading', async () => {
    render(graph(editMode([rename, move]), NODES));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    await userEvent.keyboard('{Escape}');
    expect(activeTestId()).toBe('graph-toggle-a');
  });
  it('cancelling the note dialog returns focus to the heading', async () => {
    render(graph(editMode([note, move]), NODES));
    await userEvent.click(screen.getByTestId('graph-menu-a'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Add note' }));
    await userEvent.click(await screen.findByTestId('graph-note-dialog-cancel'));
    expect(activeTestId()).toBe('graph-toggle-a');
  });
});
