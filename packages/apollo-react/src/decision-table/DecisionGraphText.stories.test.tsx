import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import * as stories from './DecisionGraphText.stories';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const { Default, Editing, Errors } = composeStories(stories);

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

  it.each([
    'shared dependency',
    'single decision',
    'cycle',
    'not a table',
  ] as const)('reveals a drawn decision from every link in the %s graph', async (graph) => {
    const links = async () => {
      const folded = () =>
        screen
          .queryAllByRole('button', { expanded: false })
          .find((toggle) => toggle.hasAttribute('data-graph-toggle'));
      for (let toggle = folded(); toggle; toggle = folded()) await userEvent.click(toggle);
      return screen.queryAllByRole('button', { name: /^Open .+'s decision$/ });
    };
    const { unmount } = render(<Default graph={graph} />);
    const count = (await links()).length;
    unmount();
    for (let index = 0; index < count; index += 1) {
      const { unmount: next } = render(<Default graph={graph} />);
      const link = (await links())[index];
      if (!link) throw new Error(`No link ${index}`);
      await userEvent.click(link);
      const revealed = /Revealed: (\S+) \/ decision/.exec(caption().textContent ?? '')?.[1];
      expect(revealed).toBeDefined();
      expect(screen.getByTestId(`graph-decision-${revealed}`)).toBeInTheDocument();
      next();
    }
    expect(count > 0).toBe(graph === 'shared dependency');
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

  it('undoes and redoes an edit in a body through the host, in the Editing story', async () => {
    render(<Editing />);
    await userEvent.click(screen.getByTestId('graph-toggle-risk'));
    const risk = rules('risk');
    await userEvent.click(body('risk').getByRole('button', { name: 'Add rule' }));
    expect(rules('risk')).toBe(risk + 1);
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(rules('risk')).toBe(risk);
    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(rules('risk')).toBe(risk + 1);
  });

  it('undoes and redoes a hit policy change from the card heading picker', async () => {
    render(<Editing />);
    const picker = screen.getByTestId('graph-risk-policy');
    const before = picker.textContent;
    await userEvent.click(picker);
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /First/ }));
    expect(screen.getByTestId('graph-risk-policy').textContent).not.toBe(before);
    screen.getByTestId('graph-risk-policy').focus();
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(screen.getByTestId('graph-risk-policy').textContent).toBe(before);
    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(screen.getByTestId('graph-risk-policy').textContent).not.toBe(before);
  });

  it('drops the selection of a rule an undo takes away, as the standalone story does', async () => {
    render(<Editing />);
    await userEvent.click(screen.getByTestId('graph-toggle-risk'));
    await userEvent.click(body('risk').getByRole('button', { name: 'Add rule' }));
    expect(caption()).toHaveTextContent(/Selected: risk \/ rule-/);
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(caption()).toHaveTextContent('Selected: none');
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
    const chip = within(screen.getByTestId('graph-hit-policy-risk'));
    await userEvent.click(chip.getByRole('button', { name: /Hit policy/ }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /First/ }));
    expect(chip.getByRole('button', { name: 'F, Hit policy: First' })).toHaveTextContent('F');
    expect(screen.getByTestId('graph-hit-policy-eligibility')).toHaveTextContent('U');
    expect(body('risk').queryByTestId(/-header$/)).toBeNull();
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

  describe('decision actions, from the keyboard alone', () => {
    const headings = () =>
      [...document.querySelectorAll<HTMLElement>('[data-graph-toggle]')].map(
        (toggle) => toggle.textContent
      );
    const focusOn = (id: string) => screen.getByTestId(`graph-toggle-${id}`).focus();

    it('renames a decision with F2, and refuses a name another decision has', async () => {
      render(<Default />);
      focusOn('net-income');
      await userEvent.keyboard('{F2}Risk{Enter}');
      expect(screen.getByRole('alert')).toHaveTextContent('Another decision already has this name');
      await userEvent.keyboard('{Control>}a{/Control}Take-home pay{Enter}');
      expect(screen.getByTestId('graph-toggle-net-income')).toHaveTextContent('Take-home pay');
      expect(screen.getByTestId('graph-toggle-net-income')).toHaveFocus();
    });

    it('moves a decision with Alt+Shift+arrows, focus following it', async () => {
      render(<Default />);
      focusOn('net-income');
      await userEvent.keyboard('{Alt>}{Shift>}{ArrowUp}{/Shift}{/Alt}');
      expect(headings()).toEqual(['Eligibility', 'Net income', 'Risk', 'Pricing']);
      expect(screen.getByTestId('graph-toggle-net-income')).toHaveFocus();
      await userEvent.keyboard('{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}');
      expect(headings()).toEqual(['Eligibility', 'Risk', 'Net income', 'Pricing']);
      expect(
        screen.getByTestId('graph-decision-net-income').closest('[class*="ms-[22px]"]')
      ).toBeNull();
      expect(screen.getByTestId('graph-toggle-net-income')).toHaveFocus();
    });

    it('deletes a decision with Delete and Enter on the confirm, focus moving to the next heading', async () => {
      render(<Default />);
      focusOn('risk');
      await userEvent.keyboard('{Delete}');
      await screen.findByRole('alertdialog');
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      expect(screen.queryByTestId('graph-decision-risk')).toBeNull();
      expect(screen.getByTestId('graph-toggle-net-income')).toHaveFocus();
    });

    it('drops the links to a decision once it is deleted', async () => {
      const links = async () => {
        const folded = () =>
          screen
            .queryAllByRole('button', { expanded: false })
            .find((toggle) => toggle.hasAttribute('data-graph-toggle'));
        for (let toggle = folded(); toggle; toggle = folded()) await userEvent.click(toggle);
        return screen
          .queryAllByRole('button', { name: /^Open .+'s decision$/ })
          .map((link) => link.getAttribute('aria-label') ?? link.textContent);
      };
      render(<Default />);
      expect(await links()).toContain("Open income's decision");
      focusOn('net-income');
      await userEvent.keyboard('{Delete}');
      await screen.findByRole('alertdialog');
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      expect(screen.queryByTestId('graph-decision-net-income')).toBeNull();
      expect(await links()).not.toContain("Open income's decision");
    });

    it('opens the menu from Tab, then adds a required input from it', async () => {
      render(<Default />);
      focusOn('pricing');
      await userEvent.tab();
      expect(screen.getByTestId('graph-pricing-policy')).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByTestId('graph-menu-pricing')).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await screen.findByRole('menu');
      const item = await screen.findByRole('menuitem', { name: 'Add required input' });
      while (document.activeElement !== item) await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      const nest = screen.getByTestId('graph-decision-new-1').parentElement?.parentElement;
      expect(nest?.previousElementSibling).toBe(screen.getByTestId('graph-decision-pricing'));
      expect(screen.getByTestId('graph-toggle-new-1')).toHaveTextContent('New decision 1');
    });

    it.each([
      ['Choose inputs', 'dialog'],
      ['Delete', 'alertdialog'],
    ] as const)('moves focus into the dialog %s opens from the menu, and back to the heading', async (name, role) => {
      render(<Default />);
      focusOn('eligibility');
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      const item = await screen.findByRole('menuitem', { name: new RegExp(`^${name}`) });
      while (document.activeElement !== item) await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      const dialog = await screen.findByRole(role);
      await vi.waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      await userEvent.keyboard('{Escape}');
      await vi.waitFor(() => expect(screen.getByTestId('graph-toggle-eligibility')).toHaveFocus());
    });

    it('shows what stands for the new logic after changing a table to a literal expression', async () => {
      await openRisk();
      await userEvent.click(screen.getByTestId('graph-menu-risk'));
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Change logic to Literal expression' })
      );
      expect(screen.getByTestId('graph-body-risk')).toHaveTextContent('Literal expression');
    });

    it('lists no rules of a table changed to a literal expression in the minimap', async () => {
      await openRisk();
      await userEvent.click(screen.getByTestId('graph-menu-risk'));
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Change logic to Literal expression' })
      );
      await userEvent.click(screen.getByTestId('graph-minimap-trigger'));
      await screen.findByTestId('graph-minimap-row-decision-risk');
      expect(document.querySelector('[data-testid^="graph-minimap-row-rule-risk-"]')).toBeNull();
    });

    it('offers no decision actions in read mode', () => {
      render(<Default mode="read" />);
      expect(screen.queryByTestId('graph-menu-risk')).toBeNull();
    });
  });
});
