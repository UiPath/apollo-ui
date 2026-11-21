import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoot } from 'react-dom/client';
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
  <DecisionGraphText
    nodes={nodes}
    mode={mode}
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
const rename: Action = { kind: 'rename', onRename: () => {} };
const inputs: Action = { kind: 'chooseInputs', onChooseInputs: () => {} };

const activeTestId = () => document.activeElement?.getAttribute('data-testid') ?? null;

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

describe('focus when the host takes away what holds it', () => {
  it('returns focus to the heading when the host withdraws rename while the field has focus', async () => {
    const { rerender } = render(graph(editMode([rename, move]), NODES));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    expect(document.activeElement).toBe(screen.getByTestId('graph-name-a-input'));
    act(() => {
      rerender(graph(editMode([move]), NODES));
    });
    expect(document.activeElement).not.toBe(document.body);
    expect(activeTestId()).toBe('graph-toggle-a');
  });

  it('returns focus to the heading when the host withdraws rename inside a shadow root', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.append(mount);
    const root = createRoot(mount);
    await act(async () => root.render(graph(editMode([rename, move]), NODES)));
    const toggleA = () => shadow.querySelector<HTMLElement>('[data-testid="graph-toggle-a"]');
    act(() => toggleA()?.focus());
    const atToggle = toggleA();
    if (atToggle === null) throw new Error('no toggle');
    fireEvent.keyDown(atToggle, { key: 'F2' });
    expect(shadow.activeElement?.getAttribute('data-testid')).toBe('graph-name-a-input');
    await act(async () => root.render(graph(editMode([move]), NODES)));
    expect(shadow.activeElement?.getAttribute('data-testid')).toBe('graph-toggle-a');
    act(() => root.unmount());
    host.remove();
  });

  it('returns focus to the heading when the host switches to read while the field has focus', async () => {
    const { rerender } = render(graph(editMode([rename, move]), NODES));
    screen.getByTestId('graph-toggle-a').focus();
    await userEvent.keyboard('{F2}');
    act(() => {
      rerender(graph({ kind: 'read', selected: null }, NODES));
    });
    expect(document.activeElement).not.toBe(document.body);
  });

  it('keeps focus in the graph when the host deletes the decision of an open links dialog', async () => {
    const { rerender } = render(graph(editMode([inputs, move]), NODES));
    await userEvent.click(screen.getByTestId('graph-menu-a'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Choose inputs' }));
    expect(await screen.findByTestId('graph-links-dialog')).toBeTruthy();
    act(() => {
      rerender(graph(editMode([inputs, move]), [leaf('b', 'B')]));
    });
    expect(screen.queryByTestId('graph-links-dialog')).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
  });

  it('keeps focus in the graph when the host withdraws every action while a card menu is open', async () => {
    const { rerender } = render(graph(editMode([inputs, move]), NODES));
    await userEvent.click(screen.getByTestId('graph-menu-a'));
    expect(await screen.findByRole('menuitem', { name: 'Choose inputs' })).toBeTruthy();
    act(() => {
      rerender(graph({ kind: 'read', selected: null }, NODES));
    });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
  });
});
