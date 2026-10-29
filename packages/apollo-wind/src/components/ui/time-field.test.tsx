import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { zhCN } from 'react-day-picker/locale/zh-CN';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_DATE_PICKER_STRINGS } from './locale-provider';
import { TimeField, type TimeFieldProps, type TimeValue } from './time-field';

function Controlled({
  initial,
  onValueChange,
  ...props
}: Partial<TimeFieldProps> & { initial?: TimeValue }) {
  const [value, setValue] = useState(initial);
  return (
    <TimeField
      use12Hour={false}
      strings={DEFAULT_DATE_PICKER_STRINGS}
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const hours = () => screen.getByRole('spinbutton', { name: 'Hours' });
const minutes = () => screen.getByRole('spinbutton', { name: 'Minutes' });

describe('TimeField', () => {
  it('shows a value as padded 24-hour segments', () => {
    render(<Controlled initial={{ hours: 9, minutes: 5 }} />);
    expect(hours()).toHaveValue('09');
    expect(minutes()).toHaveValue('05');
  });

  it('takes typed digits and moves on once the hour is complete', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);

    await user.click(hours());
    await user.keyboard('7');
    expect(minutes()).toHaveFocus();
    await user.keyboard('45');
    expect(onValueChange).toHaveBeenLastCalledWith({ hours: 7, minutes: 45 });
  });

  it('starts over on a fresh focus rather than appending to the shown value', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={{ hours: 9, minutes: 5 }} />);

    await user.click(minutes());
    await user.keyboard('30');
    await user.tab();
    expect(minutes()).toHaveValue('30');
  });

  it('steps with the arrow keys, wrapping at either end', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={{ hours: 23, minutes: 0 }} />);

    await user.click(hours());
    await user.keyboard('{ArrowUp}');
    expect(hours()).toHaveValue('00');
    await user.click(minutes());
    await user.keyboard('{ArrowDown}');
    expect(minutes()).toHaveValue('59');
  });

  it('keeps 24-hour hours apart from the period on a 12-hour clock', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Controlled use12Hour initial={{ hours: 14, minutes: 30 }} onValueChange={onValueChange} />
    );

    expect(hours()).toHaveValue('02');
    expect(screen.getByRole('radio', { name: 'PM' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'AM' }));
    expect(onValueChange).toHaveBeenLastCalledWith({ hours: 2, minutes: 30 });

    await user.click(hours());
    await user.keyboard('12');
    expect(onValueChange).toHaveBeenLastCalledWith({ hours: 0, minutes: 30 });
  });

  it("names the periods and orders the segments in the locale's way", () => {
    const { container } = render(
      <Controlled use12Hour locale={zhCN} initial={{ hours: 14, minutes: 30 }} />
    );
    const period = screen.getByRole('radio', { name: '下午' });
    expect(period).toBeChecked();
    // Chinese puts the period before the time ("下午 2:30").
    const order = [...container.querySelectorAll('[role="radio"], [role="spinbutton"]')];
    expect(order.indexOf(period)).toBeLessThan(order.indexOf(hours()));
  });

  it('labels its segments from the given strings', () => {
    render(
      <Controlled
        use12Hour
        strings={{
          ...DEFAULT_DATE_PICKER_STRINGS,
          hours: 'Stunden',
          minutes: 'Minuten',
          dayPeriod: 'Tageszeit',
        }}
      />
    );
    expect(screen.getByRole('spinbutton', { name: 'Stunden' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Minuten' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tageszeit' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <span id="time-label">Time</span>
        <Controlled use12Hour aria-labelledby="time-label" initial={{ hours: 8, minutes: 0 }} />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
