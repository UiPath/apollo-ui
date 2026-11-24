import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GRID_SENTENCE_COLUMNS,
  GRID_SENTENCE_POLICY,
  GRID_SENTENCE_RULES,
  wordRefusal,
} from './__fixtures__/sentences.fixtures';
import { outcomeField, textPropsOf } from './__fixtures__/textMode';
import { RULE_DRAG_PREVIEW_OFFSET_PX } from './constants';
import { DecisionText } from './DecisionText';

const CARD_PX = 100;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    const index = GRID_SENTENCE_RULES.findIndex((rule) => rule.rowId === this.dataset.rowId);
    const top = index < 0 ? 0 : index * CARD_PX;
    return DOMRect.fromRect({ x: 0, y: top, width: 400, height: index < 0 ? 0 : CARD_PX });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const dragView = (onMoveRule: ((from: number, to: number) => void) | undefined) => (
  <DecisionText
    name="Discount"
    {...textPropsOf({
      rules: GRID_SENTENCE_RULES,
      ...GRID_SENTENCE_COLUMNS,
      hitPolicy: GRID_SENTENCE_POLICY,
      ariaLabel: 'Rules',
      dataTestId: 'nl',
      selected: null,
      onSelect: vi.fn(),
      edit: {
        editing: null,
        onStartEdit: vi.fn(),
        onCommit: vi.fn(),
        onCancel: vi.fn(),
        onClearCell: vi.fn(),
        onDeleteRule: vi.fn(),
        valueField: outcomeField,
        wordRefusal,
        onMoveRule,
      },
    })}
  />
);
const renderDrag = (onMoveRule: ((from: number, to: number) => void) | undefined) =>
  render(dragView(onMoveRule));

const handle = (rowId: string) =>
  screen.getByTestId(`nl-row-${rowId}`).querySelector<HTMLElement>('[data-rule-action="drag"]');
const grab = (rowId: string, y: number) => {
  const target = handle(rowId);
  if (!target) throw new Error(`no handle on ${rowId}`);
  fireEvent.pointerDown(target, { clientX: 10, clientY: y, pointerId: 1, buttons: 1 });
};
const pointer = (type: string, y: number, init: PointerEventInit = {}) =>
  act(() => {
    document.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX: 10,
        clientY: y,
        buttons: 1,
        pointerId: 1,
        ...init,
      })
    );
  });
const GAP_PX = 8;
const indicator = () => document.querySelector<HTMLElement>('[data-drop-indicator]');
const dropAt = () => indicator()?.style.top ?? null;
const preview = () => document.querySelector<HTMLElement>('div[inert][aria-hidden="true"]');

describe('DecisionText rule drag', () => {
  it('holds a grip in each number pill only when the host moves rules', () => {
    const { unmount } = renderDrag(vi.fn());
    expect(handle('r1')).not.toBeNull();
    unmount();
    renderDrag(undefined);
    expect(handle('r1')).toBeNull();
  });

  it('drops a rule at the edge of the card under the pointer, showing the line there', () => {
    const onMoveRule = vi.fn();
    renderDrag(onMoveRule);
    grab('r1', 50);
    pointer('pointermove', 2 * CARD_PX + 80);
    expect(dropAt()).toBe(`${3 * CARD_PX - GAP_PX / 2}px`);
    pointer('pointermove', 2 * CARD_PX + 20);
    expect(dropAt()).toBe(`${2 * CARD_PX - GAP_PX / 2}px`);
    pointer('pointerup', 2 * CARD_PX + 20);
    expect(onMoveRule.mock.calls).toEqual([[0, 1]]);
    expect(indicator()).toBeNull();
  });

  it('shows no drop indicator until a drag has somewhere to drop, inert and hidden from readers', () => {
    renderDrag(vi.fn());
    expect(indicator()).toBeNull();
    grab('r1', 50);
    pointer('pointermove', 280);
    expect(indicator()).toHaveAttribute('aria-hidden', 'true');
    expect(indicator()).toHaveAttribute('inert');
    expect(document.querySelector('li[data-drop]')).toBeNull();
  });

  it('moves a rule up to the top edge of the first card', () => {
    const onMoveRule = vi.fn();
    renderDrag(onMoveRule);
    grab('r3', 250);
    pointer('pointermove', 10);
    expect(dropAt()).toBe(`${-GAP_PX / 2}px`);
    pointer('pointerup', 10);
    expect(onMoveRule.mock.calls).toEqual([[2, 0]]);
  });

  it('starts no drag from a press of another button than the primary one', () => {
    const onMoveRule = vi.fn();
    renderDrag(onMoveRule);
    const target = handle('r1');
    if (!target) throw new Error('no handle on r1');
    fireEvent.pointerDown(target, {
      clientX: 10,
      clientY: 50,
      pointerId: 1,
      button: 2,
      buttons: 2,
    });
    pointer('pointermove', 280);
    expect(indicator()).toBeNull();
    pointer('pointerup', 280);
    expect(onMoveRule).not.toHaveBeenCalled();
  });

  it("drops with the host's move as it is at the drop, and none once the host stops moving rules", () => {
    const first = vi.fn();
    const later = vi.fn();
    const { rerender } = renderDrag(first);
    grab('r1', 50);
    pointer('pointermove', 280);
    rerender(dragView(later));
    pointer('pointerup', 280);
    expect(first).not.toHaveBeenCalled();
    expect(later.mock.calls).toEqual([[0, 2]]);
    grab('r1', 50);
    pointer('pointermove', 280);
    rerender(dragView(undefined));
    pointer('pointerup', 280);
    expect(later).toHaveBeenCalledTimes(1);
    expect(indicator()).toBeNull();
  });

  it('drops where the pointer is released, not where it last moved', () => {
    const onMoveRule = vi.fn();
    renderDrag(onMoveRule);
    grab('r1', 50);
    pointer('pointermove', 120);
    pointer('pointerup', 280);
    expect(onMoveRule.mock.calls).toEqual([[0, 2]]);
  });

  it("sizes the dragged copy with the list's line variables", () => {
    renderDrag(vi.fn());
    expect(preview()?.style.getPropertyValue('--sentence-line')).toBe('24px');
  });

  it('shows no line and moves nothing over its own card', () => {
    const onMoveRule = vi.fn();
    renderDrag(onMoveRule);
    grab('r2', 150);
    pointer('pointermove', 120);
    expect(indicator()).toBeNull();
    pointer('pointerup', 120);
    expect(onMoveRule).not.toHaveBeenCalled();
  });

  it.each<[string, () => void]>([
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['pointercancel', () => pointer('pointercancel', 280)],
  ])('cancels on %s', (_, cancel) => {
    const onMoveRule = vi.fn();
    renderDrag(onMoveRule);
    grab('r1', 50);
    pointer('pointermove', 280);
    cancel();
    pointer('pointerup', 280);
    expect(onMoveRule).not.toHaveBeenCalled();
    expect(indicator()).toBeNull();
  });

  it('cancels when the rules change under it', () => {
    const onMoveRule = vi.fn();
    const { rerender } = renderDrag(onMoveRule);
    grab('r1', 50);
    pointer('pointermove', 280);
    rerender(
      <DecisionText
        name="Discount"
        {...textPropsOf({
          rules: GRID_SENTENCE_RULES.slice(1),
          ...GRID_SENTENCE_COLUMNS,
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          selected: null,
          onSelect: vi.fn(),
          edit: {
            editing: null,
            onStartEdit: vi.fn(),
            onCommit: vi.fn(),
            onCancel: vi.fn(),
            onClearCell: vi.fn(),
            onDeleteRule: vi.fn(),
            valueField: outcomeField,
            wordRefusal,
            onMoveRule,
          },
        })}
      />
    );
    pointer('pointerup', 280);
    expect(onMoveRule).not.toHaveBeenCalled();
  });

  it('follows the pointer with an inert copy below-right of it, emptied on drop', () => {
    renderDrag(vi.fn());
    grab('r1', 50);
    pointer('pointermove', 180);
    const copy = preview();
    expect(copy?.style.transform).toBe(
      `translate(${10 + RULE_DRAG_PREVIEW_OFFSET_PX}px, ${180 + RULE_DRAG_PREVIEW_OFFSET_PX}px)`
    );
    expect(copy?.textContent).toBe(screen.getByTestId('nl-row-r1').textContent);
    expect(copy?.querySelector('[data-testid], [data-row-id]')).toBeNull();
    pointer('pointerup', 180);
    expect(copy?.childElementCount).toBe(0);
  });
});
