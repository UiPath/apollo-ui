import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { vi } from 'vitest';
import {
  DIFF_COLUMNS,
  DIFF_POLICY,
  DIFF_RULES,
  EVERY_STATE_DIFF,
} from './__fixtures__/diffSentences.fixtures';
import {
  GRID_SENTENCE_COLUMNS,
  GRID_SENTENCE_POLICY,
  GRID_SENTENCE_RULES,
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_POLICY,
  manySentenceRules,
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
      within(screen.getByTestId('nl-header')).getByRole('button', {
        name: 'Open source of this decision, page 1',
      })
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
    await userEvent.click(
      screen.getByRole('button', { name: 'Open source of this decision, page 1' })
    );
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

  it('keeps rule citations out of the tab order in read mode', () => {
    renderView({ citations: cited() });
    expect(screen.getByTestId(`nl-citation-${firstRowId()}`).tabIndex).toBe(-1);
  });

  it('reaches rule citations in read mode with Enter on the view, then the arrow keys', async () => {
    const second: SentenceCitation = { kind: 'page', page: 5 };
    renderView({
      citations: {
        kind: 'cited',
        decision: [],
        rules: new Map([
          [firstRowId(), [RULE_CITATION, second]],
          [secondRowId(), [RULE_CITATION]],
        ]),
        onOpenCitation: vi.fn(),
      },
    });
    const view = screen.getByRole('region', { name: 'Rules' });
    view.focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByTestId(`nl-citation-${firstRowId()}`));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByTestId(`nl-citation-${firstRowId()}-1`));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByTestId(`nl-citation-${secondRowId()}`));
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(screen.getByTestId(`nl-citation-${firstRowId()}-1`));
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(view);
  });

  it.each([
    '{Control>}{Enter}{/Control}',
    '{Meta>}{Enter}{/Meta}',
    '{Shift>}{Enter}{/Shift}',
    '{Alt>}{Enter}{/Alt}',
  ])('leaves %s on a read view to the host', async (keys) => {
    const onKeyDown = vi.fn();
    renderView({ citations: cited(), containerProps: { onKeyDown } });
    const view = screen.getByRole('region', { name: 'Rules' });
    view.focus();
    await userEvent.keyboard(keys);
    expect(document.activeElement).toBe(view);
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
  });

  it('leaves Control+Home on a read view citation to the host', async () => {
    const onKeyDown = vi.fn();
    renderView({ citations: cited(), containerProps: { onKeyDown } });
    const button = screen.getByTestId(`nl-citation-${firstRowId()}`);
    button.focus();
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    expect(document.activeElement).toBe(button);
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Home' }));
  });

  it.each([
    '{Enter}',
    '{Escape}',
  ])('still passes %s it moves focus with to the host, as Tab on the view does', async (key) => {
    const onKeyDown = vi.fn();
    renderView({ citations: cited(), containerProps: { onKeyDown } });
    const view = screen.getByRole('region', { name: 'Rules' });
    view.focus();
    if (key === '{Escape}') screen.getByTestId(`nl-citation-${firstRowId()}`).focus();
    await userEvent.keyboard(key);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('moves among the citations of a rule whose id is empty', async () => {
    const rules = GRID_SENTENCE_RULES.map((rule, index) =>
      index === 0 ? { ...rule, rowId: '' } : rule
    );
    renderView({
      rules,
      citations: {
        kind: 'cited',
        decision: [],
        rules: new Map([
          ['', [RULE_CITATION, { kind: 'page', page: 5 }]],
          [secondRowId(), [RULE_CITATION]],
        ]),
        onOpenCitation: vi.fn(),
      },
    });
    screen.getByRole('region', { name: 'Rules' }).focus();
    await userEvent.keyboard('{Enter}{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByTestId('nl-citation--1'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByTestId(`nl-citation-${secondRowId()}`));
  });

  it('names a diff card citation by the rule number the card shows', () => {
    render(
      <DecisionText
        {...textPropsOf({
          rules: DIFF_RULES,
          ...DIFF_COLUMNS,
          hitPolicy: DIFF_POLICY,
          numbered: true,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          diff: { ...EVERY_STATE_DIFF, mode: 'full' },
          citations: {
            kind: 'cited',
            decision: [],
            rules: new Map([['r13', [RULE_CITATION]]]),
            onOpenCitation: vi.fn(),
          },
        })}
      />
    );
    const card = screen.getByTestId('nl-row-r13');
    const shown = card.textContent?.match(/^\D*(\d+)/)?.[1];
    expect(screen.getByTestId('nl-citation-r13').getAttribute('aria-label')).toBe(
      `Open source of rule ${shown}, page 3`
    );
  });

  it('keeps a read view citation out of the tab order on a row the host highlights', () => {
    renderView({ citations: cited(), selected: { kind: 'rule', rowId: firstRowId() } });
    expect(screen.getByTestId(`nl-citation-${firstRowId()}`).tabIndex).toBe(-1);
  });

  describe('in a windowed read view', () => {
    const MANY = manySentenceRules(400);
    const far = (rowIds: readonly string[], onOpenCitation = vi.fn()): DecisionTextCitations => ({
      kind: 'cited',
      decision: [],
      rules: new Map(rowIds.map((rowId) => [rowId, [RULE_CITATION, { kind: 'page', page: 8 }]])),
      onOpenCitation,
    });
    const renderMany = (rowIds: readonly string[]) =>
      render(
        <DecisionText
          {...textPropsOf({
            rules: MANY,
            ...MULTI_SENTENCE_COLUMNS,
            hitPolicy: MULTI_SENTENCE_POLICY,
            ariaLabel: 'Rules',
            dataTestId: 'nl',
            citations: far(rowIds),
          })}
        />
      );
    const focusedRowId = () => document.activeElement?.closest('li')?.dataset.rowId;

    it('reaches a citation outside the window with Enter on the view', async () => {
      renderMany(['row-350']);
      expect(screen.queryByTestId('nl-row-row-350')).toBeNull();
      screen.getByRole('region', { name: 'Rules' }).focus();
      await userEvent.keyboard('{Enter}');
      expect(document.activeElement).toBe(screen.getByTestId('nl-citation-row-350'));
    });

    it('leaves focus outside when the host moves it there before an off-window citation mounts', async () => {
      const outside = document.createElement('button');
      document.body.append(outside);
      const citations = far(['row-350']);
      const view = (selected: SentenceSelection | null) => (
        <DecisionText
          {...textPropsOf({
            rules: MANY,
            ...MULTI_SENTENCE_COLUMNS,
            hitPolicy: MULTI_SENTENCE_POLICY,
            ariaLabel: 'Rules',
            dataTestId: 'nl',
            citations,
            selected,
            containerProps: { onKeyDown: () => outside.focus() },
          })}
        />
      );
      const { rerender } = render(view(null));
      screen.getByRole('region', { name: 'Rules' }).focus();
      await userEvent.keyboard('{Enter}');
      rerender(view({ kind: 'rule', rowId: 'row-350' }));
      expect(screen.getByTestId('nl-citation-row-350')).toBeTruthy();
      expect(document.activeElement).toBe(outside);
      outside.remove();
    });

    it('reveals a mounted citation the arrows reach the way the view reveals its stops', async () => {
      const Host = () => {
        const [container, setContainer] = useState<HTMLDivElement | null>(null);
        return (
          <div ref={setContainer} style={{ overflowY: 'auto', height: 600 }}>
            {container && (
              <DecisionText
                {...textPropsOf({
                  rules: MANY,
                  ...MULTI_SENTENCE_COLUMNS,
                  hitPolicy: MULTI_SENTENCE_POLICY,
                  ariaLabel: 'Rules',
                  dataTestId: 'nl',
                  citations: far(['row-0', 'row-1']),
                  scroll: { container },
                })}
              />
            )}
          </div>
        );
      };
      render(<Host />);
      screen.getByRole('region', { name: 'Rules' }).focus();
      await userEvent.keyboard('{Enter}');
      const target = screen.getByTestId('nl-citation-row-1');
      const reveal = vi.fn();
      target.scrollIntoView = reveal;
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(document.activeElement).toBe(target);
      expect(reveal).toHaveBeenCalled();
    });

    it('crosses a gap wider than the window with the arrows, and Home and End reach the ends', async () => {
      renderMany(['row-1', 'row-350', 'row-399']);
      screen.getByRole('region', { name: 'Rules' }).focus();
      await userEvent.keyboard('{Enter}{ArrowDown}{ArrowDown}');
      expect(document.activeElement).toBe(screen.getByTestId('nl-citation-row-350'));
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(screen.getByTestId('nl-citation-row-1-1'));
      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(screen.getByTestId('nl-citation-row-399-1'));
      await userEvent.keyboard('{Home}');
      expect(focusedRowId()).toBe('row-1');
      expect(document.activeElement).toBe(screen.getByTestId('nl-citation-row-1'));
    });
  });

  it('shows rule citations and the header citation on a touch screen', () => {
    renderView({ citations: cited(), selected: null, onSelect: vi.fn() });
    expect(screen.getByTestId(`nl-citation-${firstRowId()}`).className).toContain(
      '[@media(hover:none)]:opacity-100'
    );
    expect(screen.getByTestId('nl-citation').className).toContain(
      '[@media(hover:none)]:opacity-100'
    );
  });

  it('shows the header citation page like a card', () => {
    renderView({ citations: cited() });
    expect(within(screen.getByTestId('nl-citation')).getByText('Page 1')).toBeTruthy();
  });

  it('names each citation by its rule, and numbers those sharing a page', () => {
    const box: SentenceCitation = { kind: 'box', page: 3, box: BOX };
    renderView({
      citations: {
        kind: 'cited',
        decision: [DECISION_CITATION],
        rules: new Map([
          [firstRowId(), [RULE_CITATION, box, { kind: 'page', page: 4 }]],
          [secondRowId(), [RULE_CITATION]],
        ]),
        onOpenCitation: vi.fn(),
      },
    });
    const names = (rowId: string) =>
      within(card(rowId))
        .getAllByRole('button', { name: /Open source/ })
        .map((button) => button.getAttribute('aria-label'));
    expect(names(firstRowId())).toEqual([
      'Open source 1 of rule 1, page 3',
      'Open source 2 of rule 1, page 3',
      'Open source of rule 1, page 4',
    ]);
    expect(names(secondRowId())).toEqual(['Open source of rule 2, page 3']);
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
    await userEvent.click(
      header.getByRole('button', { name: 'Open source of this decision, page 2' })
    );
    expect(onOpenCitation).toHaveBeenLastCalledWith(DECISION_BOX_CITATION);
    const rule = within(card(firstRowId()));
    expect(rule.getAllByRole('button', { name: /Open source/ })).toHaveLength(2);
    await userEvent.click(rule.getByRole('button', { name: 'Open source of rule 1, page 5' }));
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
