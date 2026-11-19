import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { vi } from 'vitest';
import {
  GRID_SENTENCE_COLUMNS,
  GRID_SENTENCE_POLICY,
  GRID_SENTENCE_RULES,
} from './__fixtures__/sentences.fixtures';
import { type FixtureTextProps, textPropsOf } from './__fixtures__/textMode';
import { DecisionText } from './DecisionText';
import type { DecisionTextCitations, SentenceCitation, SentenceSelection } from './sentenceTypes';

const BOX = { x: 10, y: 20, width: 300, height: 40 };
const DECISION_CITATION: SentenceCitation = { kind: 'page', page: 1 };
const DECISION_BOX_CITATION: SentenceCitation = {
  kind: 'box',
  page: 2,
  box: BOX,
};
const RULE_CITATION: SentenceCitation = { kind: 'block', page: 3, blockId: 7, box: BOX };

const firstRowId = () => GRID_SENTENCE_RULES[0]?.rowId ?? '';
const secondRowId = () => GRID_SENTENCE_RULES[1]?.rowId ?? '';

const cited = (onOpenCitation = vi.fn()): DecisionTextCitations => ({
  kind: 'cited',
  decision: [DECISION_CITATION],
  rules: new Map([[firstRowId(), [RULE_CITATION]]]),
  onOpenCitation,
});

const renderView = (props: Partial<Parameters<typeof textPropsOf>[0]> = {}) =>
  render(
    <DecisionText
      {...(textPropsOf({
        rules: GRID_SENTENCE_RULES,
        ...GRID_SENTENCE_COLUMNS,
        hitPolicy: GRID_SENTENCE_POLICY,
        ariaLabel: 'Rules',
        dataTestId: 'nl',
        ...props,
      }) satisfies FixtureTextProps)}
    />
  );

const card = (rowId: string) => screen.getByTestId(`nl-row-${rowId}`);

describe('DecisionText citations', () => {
  afterEach(cleanup);

  it('shows no citation button without citations', () => {
    renderView();
    expect(screen.queryByTestId('nl-citation')).toBeNull();
    expect(screen.queryAllByRole('button', { name: /Open source/ })).toHaveLength(0);
  });

  it('puts the decision citation on the header and each cited rule on its card', () => {
    renderView({ citations: cited() });
    expect(
      within(screen.getByTestId('nl-header')).getByRole('button', { name: 'Open source, page 1' })
    ).toBeTruthy();
    expect(within(card(firstRowId())).getByTestId(`nl-citation-${firstRowId()}`)).toBeTruthy();
    expect(within(card(secondRowId())).queryByTestId(`nl-citation-${secondRowId()}`)).toBeNull();
  });

  it('hides the rule citation at rest and its page until the rule is selected', () => {
    const view = renderView({ citations: cited(), selected: null, onSelect: vi.fn() });
    const button = screen.getByTestId(`nl-citation-${firstRowId()}`);
    expect(button.className).toContain('opacity-0');
    expect(button.className).toContain('group-hover/row:opacity-100');
    expect(button.tabIndex).toBe(-1);
    expect(within(button).queryByText('Page 3')).toBeNull();

    view.rerender(
      <DecisionText
        {...textPropsOf({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          citations: cited(),
          selected: { kind: 'rule', rowId: firstRowId() },
          onSelect: vi.fn(),
        })}
      />
    );
    const selected = screen.getByTestId(`nl-citation-${firstRowId()}`);
    expect(selected.tabIndex).toBe(0);
    expect(within(selected).getByText('Page 3')).toBeTruthy();
  });

  it('opens the rule citation on click and selects its rule', async () => {
    const onOpenCitation = vi.fn();
    const onSelect = vi.fn();
    renderView({ citations: cited(onOpenCitation), selected: null, onSelect });
    await userEvent.click(screen.getByTestId(`nl-citation-${firstRowId()}`));
    expect(onOpenCitation).toHaveBeenCalledTimes(1);
    expect(onOpenCitation).toHaveBeenCalledWith(RULE_CITATION);
    expect(onSelect).toHaveBeenCalledWith({ kind: 'rule', rowId: firstRowId() });
  });

  it('opens the decision citation from the header', async () => {
    const onOpenCitation = vi.fn();
    renderView({ citations: cited(onOpenCitation) });
    await userEvent.click(screen.getByRole('button', { name: 'Open source, page 1' }));
    expect(onOpenCitation).toHaveBeenCalledTimes(1);
    expect(onOpenCitation).toHaveBeenCalledWith(DECISION_CITATION);
  });

  it('opens a selected rule citation with Enter without moving the selection', async () => {
    const onOpenCitation = vi.fn();
    const onSelect = vi.fn();
    renderView({
      citations: cited(onOpenCitation),
      selected: { kind: 'rule', rowId: firstRowId() },
      onSelect,
    });
    const button = screen.getByTestId(`nl-citation-${firstRowId()}`);
    button.focus();
    await userEvent.keyboard('{Enter}');
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(onOpenCitation).toHaveBeenCalledTimes(1);
    expect(onOpenCitation).toHaveBeenCalledWith(RULE_CITATION);
    expect(onSelect).not.toHaveBeenCalledWith({ kind: 'rule', rowId: secondRowId() });
  });

  it('reaches a rule citation by Tab in read mode', async () => {
    renderView({ citations: cited() });
    const button = screen.getByTestId(`nl-citation-${firstRowId()}`);
    expect(button.tabIndex).toBe(0);
    const reached = [];
    for (let press = 0; press < 30 && document.activeElement !== button; press += 1) {
      await userEvent.tab();
      reached.push(document.activeElement);
    }
    expect(reached).toContain(button);
  });

  it('keeps a rule citation out of the tab order until its row is selected', () => {
    renderView({
      citations: cited(),
      selected: { kind: 'rule', rowId: secondRowId() },
      onSelect: vi.fn(),
    });
    expect(screen.getByTestId(`nl-citation-${firstRowId()}`).tabIndex).toBe(-1);
  });

  it.each(['{Enter}', ' '])('keeps focus on a rule citation after %s', async (key) => {
    const onOpenCitation = vi.fn();
    const Host = () => {
      const [selected, setSelected] = useState<SentenceSelection | null>({
        kind: 'rule',
        rowId: firstRowId(),
      });
      return (
        <DecisionText
          {...textPropsOf({
            rules: GRID_SENTENCE_RULES,
            ...GRID_SENTENCE_COLUMNS,
            hitPolicy: GRID_SENTENCE_POLICY,
            ariaLabel: 'Rules',
            dataTestId: 'nl',
            citations: cited(onOpenCitation),
            selected,
            onSelect: setSelected,
          })}
        />
      );
    };
    render(<Host />);
    const button = screen.getByTestId(`nl-citation-${firstRowId()}`);
    button.focus();
    await userEvent.keyboard(key);
    expect(onOpenCitation).toHaveBeenCalledWith(RULE_CITATION);
    expect(document.activeElement).toBe(button);
  });

  it.each(['{Enter}', ' '])('leaves focus where the host moved it on %s', async (key) => {
    const viewer = document.createElement('button');
    document.body.append(viewer);
    renderView({
      citations: cited(vi.fn(() => viewer.focus())),
      selected: { kind: 'rule', rowId: firstRowId() },
      onSelect: vi.fn(),
    });
    screen.getByTestId(`nl-citation-${firstRowId()}`).focus();
    await userEvent.keyboard(key);
    expect(document.activeElement).toBe(viewer);
    viewer.remove();
  });

  it('shows one button per citation of a rule and of the decision, each opening its own', async () => {
    const onOpenCitation = vi.fn();
    const second: SentenceCitation = { kind: 'page', page: 5 };
    renderView({
      citations: {
        kind: 'cited',
        decision: [DECISION_CITATION, DECISION_BOX_CITATION],
        rules: new Map([[firstRowId(), [RULE_CITATION, second]]]),
        onOpenCitation,
      },
    });
    const header = within(screen.getByTestId('nl-header'));
    expect(header.getAllByRole('button', { name: /Open source/ })).toHaveLength(2);
    await userEvent.click(header.getByRole('button', { name: 'Open source, page 2' }));
    expect(onOpenCitation).toHaveBeenLastCalledWith(DECISION_BOX_CITATION);
    const rule = within(card(firstRowId()));
    expect(rule.getAllByRole('button', { name: /Open source/ })).toHaveLength(2);
    await userEvent.click(rule.getByRole('button', { name: 'Open source, page 5' }));
    expect(onOpenCitation).toHaveBeenLastCalledWith(second);
  });

  it('has no axe violations with citations', async () => {
    const { container } = renderView({
      citations: cited(),
      selected: { kind: 'rule', rowId: firstRowId() },
      onSelect: vi.fn(),
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
