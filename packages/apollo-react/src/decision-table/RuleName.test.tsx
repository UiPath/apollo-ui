import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuleName } from './RuleName';

afterEach(cleanup);

const labels = { ruleNameLabel: 'Rule name', ruleNamePlaceholder: 'Name this rule…' };

const renderName = (name = 'Prime') => {
  const onRename = vi.fn();
  render(<RuleName rowId="r2" name={name} selected labels={labels} onRename={onRename} />);
  return { onRename, field: screen.getByRole('textbox', { name: 'Rule name' }) };
};

describe('RuleName', () => {
  it('renames to the trimmed text on Enter and on blur', () => {
    const { onRename, field } = renderName();
    fireEvent.change(field, { target: { value: '  Gold  ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    fireEvent.change(field, { target: { value: 'Silver' } });
    fireEvent.blur(field);
    expect(onRename.mock.calls).toEqual([
      ['r2', 'Gold'],
      ['r2', 'Silver'],
    ]);
  });

  it('calls nothing for an unchanged name', () => {
    const { onRename, field } = renderName();
    fireEvent.change(field, { target: { value: ' Prime ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    fireEvent.blur(field);
    expect(onRename).not.toHaveBeenCalled();
  });

  it('restores the name on Escape, renaming nothing on the blur after it', () => {
    const { onRename, field } = renderName();
    fireEvent.change(field, { target: { value: 'Gold' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(field).toHaveValue('Prime');
    fireEvent.blur(field);
    expect(onRename).not.toHaveBeenCalled();
  });

  it('leaves Enter and Escape to an IME composition', () => {
    const { onRename, field } = renderName();
    fireEvent.change(field, { target: { value: 'Gold' } });
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(field, { key: 'Escape', isComposing: true });
    expect(onRename).not.toHaveBeenCalled();
    expect(field).toHaveValue('Gold');
  });

  it("shows an unnamed rule's placeholder as the grid's empty name", () => {
    const { field } = renderName('');
    expect(field).toHaveAttribute('placeholder', 'Name this rule…');
  });
});
