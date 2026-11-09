import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { EdgeInsertButton } from './EdgeInsertButton';

describe('EdgeInsertButton', () => {
  const renderInside = () => {
    const parent = { onClick: vi.fn(), onPointerDown: vi.fn(), onKeyDown: vi.fn() };
    const onInsert = vi.fn();
    render(
      <div {...parent}>
        <EdgeInsertButton axis="row" testId="insert" onInsert={onInsert} />
      </div>
    );
    return { parent, onInsert, button: screen.getByTestId('insert') };
  };

  it('inserts on a click without also clicking what it sits in', () => {
    const { parent, onInsert, button } = renderInside();

    fireEvent.click(button);

    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(parent.onClick).not.toHaveBeenCalled();
  });

  it('stays out of the tab order, which would otherwise stop on every row and header', () => {
    const { button } = renderInside();

    expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('keeps its press from reaching what it sits in, so it never starts a drag', () => {
    const { parent, button } = renderInside();

    fireEvent.pointerDown(button);

    expect(parent.onPointerDown).not.toHaveBeenCalled();
  });

  it.each([
    'Enter',
    ' ',
    'Tab',
    'a',
  ])('keeps %j from the table, whose keyboard navigation would take it from the "+"', (key) => {
    const { parent, button } = renderInside();

    fireEvent.keyDown(button, { key });

    expect(parent.onKeyDown).not.toHaveBeenCalled();
  });

  it.each([
    ['row', 'Insert row above', '-top-1.5'],
    ['column', 'Insert column left', '-left-1.5'],
  ] as const)("names a %s insert in the table's own words, on its edge", (axis, name, edge) => {
    render(<EdgeInsertButton axis={axis} testId="insert" zoneTestId="zone" onInsert={vi.fn()} />);

    expect(screen.getByTestId('insert')).toHaveAccessibleName(name);
    expect(screen.getByTestId('insert')).toHaveAttribute('title', name);
    expect(screen.getByTestId('zone')).toHaveClass(edge);
  });

  it('lights its line for keyboard focus only, so a clicked "+" does not stay marked', () => {
    render(<EdgeInsertButton axis="row" testId="insert" zoneTestId="zone" onInsert={vi.fn()} />);

    const line = screen.getByTestId('zone').firstElementChild!;
    expect(line.className).not.toContain('focus-within');
    expect(line).toHaveClass('group-has-[:focus-visible]/insert:opacity-100!');
  });
});
