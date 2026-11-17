import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import * as stories from './DecisionGraphText.stories';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const { Default, Errors } = composeStories(stories);

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

const caption = () => screen.getByTestId('graph-caption');
const body = (id: string) => within(screen.getByTestId(`graph-body-${id}`));
const rules = (id: string) =>
  screen.getByTestId(`graph-body-${id}`).querySelectorAll('li[data-row-id]').length;
const sentence = (id: string, rowId: string) =>
  screen.getByTestId(`text-${id}-row-${rowId}`).textContent;

const openRisk = async () => {
  render(<Default />);
  await userEvent.click(screen.getByTestId('graph-toggle-risk'));
};

describe('DecisionGraphText stories', () => {
  it.each([
    'read',
    'select',
    'edit',
  ] as const)('opens Risk on its far rule from the warning, pressed from the keyboard in %s mode', async (mode) => {
    render(<Errors mode={mode} />);
    screen.getByTestId('graph-mark-risk').focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByTestId('text-risk-row-r20'));
  });

  it('opens Risk in place without scrolling when its warning is clicked', async () => {
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    render(<Errors />);
    const scroller = screen.getByTestId('graph-scroller');
    scroller.scrollTop = 120;
    await userEvent.click(screen.getByTestId('graph-mark-risk'));
    expect(screen.getByTestId('graph-body-risk')).toBeInTheDocument();
    expect(scroller.scrollTop).toBe(120);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(caption()).toHaveTextContent('Revealed: none');
  });

  it('opens a decision on Alt+Enter on its heading', async () => {
    render(<Default />);
    screen.getByTestId('graph-toggle-pricing').focus();
    await userEvent.keyboard('{Alt>}{Enter}{/Alt}');
    expect(caption()).toHaveTextContent('Opened: pricing');
  });

  it('opens a decision on a double-click of its heading', async () => {
    render(<Default />);
    await userEvent.dblClick(screen.getByTestId('graph-rule-count-risk'));
    expect(caption()).toHaveTextContent('Opened: risk');
  });

  it('edits an outcome in a body and words the rule again', async () => {
    await openRisk();
    const before = sentence('risk', 'r1');
    const outcome = screen
      .getByTestId('text-risk-row-r1')
      .querySelector<HTMLElement>('[data-kind="value"][data-column-id="risk"]');
    if (!outcome) throw new Error('No risk outcome in rule 1');
    await userEvent.click(outcome);
    const review = (await screen.findAllByRole('radio')).find(
      (radio) => radio.getAttribute('value') === '"review"'
    );
    if (!review) throw new Error('No "review" choice');
    await userEvent.click(review);
    const apply = screen.queryByRole('button', { name: 'Apply' });
    if (apply) await userEvent.click(apply);
    expect(sentence('risk', 'r1')).not.toBe(before);
    expect(sentence('risk', 'r1')).toContain('review');
  });

  it('adds a rule to the decision whose Add rule is pressed, and only to it', async () => {
    await openRisk();
    const count = (id: string) => screen.getByTestId(`graph-rule-count-${id}`).textContent;
    const risk = rules('risk');
    const others = ['eligibility', 'net-income', 'pricing'].map(count);
    await userEvent.click(body('risk').getByRole('button', { name: 'Add rule' }));
    expect(rules('risk')).toBe(risk + 1);
    expect(count('risk')).toContain(String(risk + 1));
    expect(['eligibility', 'net-income', 'pricing'].map(count)).toEqual(others);
  });

  it.each([
    ['Duplicate rule', 1],
    ['Insert rule below', 1],
    ['Delete rule 1', -1],
  ] as const)('runs %s from a rule menu in a body', async (action, change) => {
    await openRisk();
    const count = rules('risk');
    await userEvent.click(body('risk').getByRole('button', { name: 'Rule 1 actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: action }));
    expect(rules('risk')).toBe(count + change);
  });

  it('moves a rule down from its menu', async () => {
    await openRisk();
    const first = sentence('risk', 'r1');
    await userEvent.click(body('risk').getByRole('button', { name: 'Rule 1 actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move down' }));
    const [top] = screen.getByTestId('graph-body-risk').querySelectorAll('li[data-row-id]');
    expect(top?.textContent).not.toBe(first);
  });

  it('clears a rule from its menu', async () => {
    await openRisk();
    const first = sentence('risk', 'r1');
    await userEvent.click(body('risk').getByRole('button', { name: 'Rule 1 actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Clear rule' }));
    expect(sentence('risk', 'r1')).not.toBe(first);
  });

  it('adds a new input from the + of a rule', async () => {
    await openRisk();
    const columns = () =>
      screen.getByTestId('graph-body-risk').querySelectorAll('[data-column-id]').length;
    const before = columns();
    await userEvent.click(body('risk').getByRole('button', { name: 'Add condition to rule 1' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Add input column' }));
    expect(columns()).toBeGreaterThan(before);
  });

  it('changes the hit policy of one decision', async () => {
    await openRisk();
    await userEvent.click(body('risk').getByRole('button', { name: /Hit policy/ }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /First/ }));
    expect(screen.getByTestId('graph-body-risk')).toHaveTextContent('First');
  });

  it('renames a column of one decision', async () => {
    await openRisk();
    const [pill] = body('risk').getAllByRole('button', { name: /^risk$/i });
    if (!pill) throw new Error('No risk column pill');
    await userEvent.click(pill);
    await screen.findByRole('button', { name: 'Apply' });
    const name = document.querySelector<HTMLInputElement>('input[id$="-label"]');
    if (!name) throw new Error('No name field');
    await userEvent.clear(name);
    await userEvent.type(name, 'Danger');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByTestId('graph-body-risk')).toHaveTextContent('Danger');
  });
});
