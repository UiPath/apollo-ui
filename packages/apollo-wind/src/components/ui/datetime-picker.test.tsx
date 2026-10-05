import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DateTimePicker } from './datetime-picker';
import { InputGroup } from './input-group';

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button'));
  await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument());
}

async function choose(user: ReturnType<typeof userEvent.setup>, select: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: select }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('DateTimePicker', () => {
  describe('rendering', () => {
    it('renders the default placeholder', () => {
      render(<DateTimePicker />);
      expect(screen.getByText('Pick a date and time')).toBeInTheDocument();
    });

    it('renders a custom placeholder', () => {
      render(<DateTimePicker placeholder="Choose when" />);
      expect(screen.getByText('Choose when')).toBeInTheDocument();
    });

    it('renders a formatted value when one is provided', () => {
      render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} />);
      expect(screen.getByText(/June 15th, 2024 at 14:30/)).toBeInTheDocument();
    });

    it('formats the time in 12-hour style when use12Hour is set', () => {
      render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} use12Hour />);
      expect(screen.getByText(/June 15th, 2024 at 02:30 PM/)).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<DateTimePicker disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('merges custom className on the trigger', () => {
      render(<DateTimePicker className="custom-picker" />);
      expect(screen.getByRole('button')).toHaveClass('custom-picker');
    });
  });

  describe('ref forwarding', () => {
    it('forwards its ref to the trigger button', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<DateTimePicker ref={ref} />);
      expect(ref.current).toBe(screen.getByRole('button'));
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(<DateTimePicker />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('interactions', () => {
    it('opens the popover with a calendar on click', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('calls onValueChange when a date is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /15/ }));

      expect(handleChange).toHaveBeenCalledTimes(1);
      const selected = handleChange.mock.calls[0][0] as Date;
      expect(selected.getDate()).toBe(15);
    });

    it('updates the value when a time is chosen after picking a date', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker onValueChange={handleChange} />);

      await openPicker(user);
      await user.click(screen.getByRole('button', { name: /15/ }));
      await choose(user, 'Hour', '13');
      await choose(user, 'Minute', '45');

      const lastCall = handleChange.mock.calls.at(-1)?.[0] as Date;
      expect(lastCall.getDate()).toBe(15);
      expect(lastCall.getHours()).toBe(13);
      expect(lastCall.getMinutes()).toBe(45);
    });

    it('stays open after a day is picked, so the time can be set', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker />);

      await openPicker(user);
      await user.click(screen.getByRole('button', { name: /15/ }));

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('applies a time chosen before the day', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <DateTimePicker
          onValueChange={handleChange}
          calendarProps={{ defaultMonth: new Date(2024, 5, 1) }}
        />
      );

      await openPicker(user);
      await choose(user, 'Hour', '09');
      expect(handleChange).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /15/ }));
      expect(handleChange).toHaveBeenLastCalledWith(new Date(2024, 5, 15, 9, 0));
    });

    it('keeps the time when the day changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} onValueChange={handleChange} />);

      await openPicker(user);
      await user.click(screen.getByText('20'));

      expect(handleChange).toHaveBeenLastCalledWith(new Date(2024, 5, 20, 14, 30));
    });

    it('resets the value and closes when Clear is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(handleChange).toHaveBeenCalledWith(undefined);
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Pick a date and time')).toBeInTheDocument();
    });

    it('closes the popover when Done is clicked', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Done' }));

      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
    });

    it('disables Done until a date is selected', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
    });
  });

  describe('value vs placeholder color', () => {
    it('mutes the placeholder via its own span', () => {
      render(<DateTimePicker placeholder="Pick a date and time" />);
      const placeholder = screen.getByText('Pick a date and time');
      expect(placeholder.tagName).toBe('SPAN');
      expect(placeholder).toHaveClass('text-foreground-muted');
    });

    it('renders a selected value at full strength', () => {
      const { container } = render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} />);
      expect(screen.getByRole('button')).toHaveTextContent(/June 15/);
      expect(container.querySelector('.text-foreground-muted')).toBeNull();
    });

    it('overrides the outline variant so the trigger is not globally muted', () => {
      render(<DateTimePicker />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('future:text-foreground');
      expect(trigger).not.toHaveClass('future:text-muted-foreground');
    });
  });

  describe('trigger icon color', () => {
    it('mutes the icon and brightens it on hover', () => {
      render(<DateTimePicker />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('[&>svg]:text-foreground-muted');
      expect(trigger).toHaveClass('hover:[&>svg]:text-accent-foreground');
    });

    // The [&>svg] selector only matches a direct child, so wrapping the icon
    // would silently drop both rules.
    it('keeps the icon a direct child of the trigger', () => {
      render(<DateTimePicker />);
      const trigger = screen.getByRole('button');
      expect(trigger.querySelector(':scope > svg')).not.toBeNull();
    });
  });
});

describe('DateTimePicker inline validation', () => {
  it('renders the message and wires aria attributes to it', () => {
    render(<DateTimePicker id="deadline" error="Choose a later deadline." />);
    const trigger = screen.getByRole('button');
    const message = screen.getByText('Choose a later deadline.');

    expect(trigger).toHaveAttribute('id', 'deadline');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'deadline-error');
    expect(trigger).toHaveAttribute('aria-errormessage', 'deadline-error');
    expect(message).toHaveAttribute('id', 'deadline-error');
    expect(message).toHaveClass('text-error');
  });

  it('still forwards a bare aria-invalid without rendering a message', () => {
    render(<DateTimePicker aria-invalid />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
  });
});

describe('DateTimePicker controlled value', () => {
  it('follows a value the parent changes after mount', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} />);
    rerender(<DateTimePicker value={new Date(2025, 0, 2, 16, 20)} />);
    expect(screen.getByText(/January 2nd, 2025 at 16:20/)).toBeInTheDocument();

    await openPicker(user);
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('16');
    expect(screen.getByRole('combobox', { name: 'Minute' })).toHaveTextContent('20');
  });

  it('clears when the parent clears the value', () => {
    const { rerender } = render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} />);
    rerender(<DateTimePicker value={undefined} />);
    expect(screen.getByText('Pick a date and time')).toBeInTheDocument();
  });

  it('reports opening and closing, including through Done', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe('DateTimePicker remount safety', () => {
  it('keeps the same trigger node and focus when an error appears', () => {
    const { rerender } = render(<DateTimePicker id="deadline" />);
    const before = screen.getByRole('button');
    before.focus();
    expect(before).toHaveFocus();

    rerender(<DateTimePicker id="deadline" error="Choose a later deadline." />);
    const after = screen.getByRole('button');

    expect(after).toBe(before);
    expect(after).toHaveFocus();
  });
});

describe('DateTimePicker time selects', () => {
  it('offers minutes in steps of minuteStep', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker minuteStep={15} />);

    await openPicker(user);
    await user.click(screen.getByRole('combobox', { name: 'Minute' }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['00', '15', '30', '45']);
  });

  it('keeps a minute that is off the step selectable', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={new Date(2024, 5, 15, 14, 37)} />);

    await openPicker(user);
    expect(screen.getByRole('combobox', { name: 'Minute' })).toHaveTextContent('37');
  });

  it('uses 12-hour selects with AM and PM when use12Hour is set', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <DateTimePicker
        use12Hour
        value={new Date(2024, 5, 15, 14, 30)}
        onValueChange={handleChange}
      />
    );

    await openPicker(user);
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('02');
    expect(screen.getByRole('combobox', { name: 'AM or PM' })).toHaveTextContent('PM');

    await choose(user, 'AM or PM', 'AM');
    expect(handleChange).toHaveBeenLastCalledWith(new Date(2024, 5, 15, 2, 30));

    await choose(user, 'Hour', '12');
    expect(handleChange).toHaveBeenLastCalledWith(new Date(2024, 5, 15, 0, 30));
  });

  it('groups the time selects under the Time legend', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker />);

    await openPicker(user);
    expect(screen.getByRole('group', { name: 'Time' })).toContainElement(
      screen.getByRole('combobox', { name: 'Hour' })
    );
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} />);

    await openPicker(user);
    const popover = document.querySelector("[data-slot='popover-content']") as HTMLElement;
    expect(await axe(popover)).toHaveNoViolations();
  });
});

describe('DateTimePicker popover', () => {
  it('opens on the selected month with the drilldown caption', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={new Date(2024, 2, 10, 9, 0)} />);

    await openPicker(user);
    expect(screen.getByRole('button', { name: /March, choose month/ })).toBeInTheDocument();
  });

  it('moves focus to the selected day', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} />);

    await openPicker(user);
    await waitFor(() => expect(screen.getByText('15').closest('button')).toHaveFocus());
  });

  it('forwards popoverProps and aligns to the start by default', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DateTimePicker />);

    await openPicker(user);
    expect(document.querySelector("[data-slot='popover-content']")).toHaveAttribute(
      'data-align',
      'start'
    );

    rerender(<DateTimePicker popoverProps={{ align: 'end', className: 'custom-popover' }} />);
    const popover = document.querySelector("[data-slot='popover-content']");
    await waitFor(() => expect(popover).toHaveAttribute('data-align', 'end'));
    expect(popover).toHaveClass('custom-popover');
  });

  it('follows a value changed by the parent', () => {
    const { rerender } = render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} />);
    expect(screen.getByRole('button')).toHaveTextContent('June 15th, 2024 at 09:00');

    rerender(<DateTimePicker value={new Date(2024, 6, 1, 18, 5)} />);
    expect(screen.getByRole('button')).toHaveTextContent('July 1st, 2024 at 18:05');

    rerender(<DateTimePicker value={undefined} />);
    expect(screen.getByRole('button')).toHaveTextContent('Pick a date and time');
  });

  it('formats the value with displayFormat', () => {
    render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} displayFormat="dd/MM/yyyy HH:mm" />);
    expect(screen.getByRole('button')).toHaveTextContent('15/06/2024 09:00');
  });
});

describe('DateTimePicker timezone', () => {
  // 11:00Z is 14:00 in Bucharest (GMT+3) and 20:00 in Tokyo (GMT+9) in June.
  const instant = new Date(Date.UTC(2024, 5, 15, 11, 0));

  it('shows no timezone select unless showTimeZone is set', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={instant} />);

    await openPicker(user);
    expect(screen.queryByText('Timezone')).not.toBeInTheDocument();
  });

  it('reads the value in the zone and names the offset', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker value={instant} showTimeZone timeZone="Europe/Bucharest" />);

    expect(screen.getByRole('button')).toHaveTextContent('June 15th, 2024 at 14:00 GMT+3');
    await openPicker(user);
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('14');
    expect(screen.getByRole('button', { name: /Timezone.*Bucharest/ })).toHaveTextContent('GMT+3');
  });

  it('commits the chosen wall clock in the zone', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <DateTimePicker
        value={instant}
        showTimeZone
        timeZone="Europe/Bucharest"
        onValueChange={handleChange}
      />
    );

    await openPicker(user);
    await choose(user, 'Hour', '09');
    expect(handleChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2024, 5, 15, 6, 0)));
  });

  it('keeps the time on screen and moves the instant when the zone changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleZone = vi.fn();
    render(
      <DateTimePicker
        value={instant}
        showTimeZone
        defaultTimeZone="Europe/Bucharest"
        onValueChange={handleChange}
        onTimeZoneChange={handleZone}
      />
    );

    await openPicker(user);
    await user.click(screen.getByRole('button', { name: /Timezone.*Bucharest/ }));
    await user.type(screen.getByPlaceholderText('Search city, region or offset'), 'tokyo');
    await user.click(await screen.findByRole('option', { name: /Tokyo/ }));

    expect(handleZone).toHaveBeenCalledWith('Asia/Tokyo');
    // 14:00 in Tokyo is 05:00Z.
    expect(handleChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2024, 5, 15, 5, 0)));
    expect(screen.getByRole('button', { name: /Timezone.*Tokyo/ })).toHaveTextContent('GMT+9');
  });

  it('offers the viewer’s own zone first', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker showTimeZone defaultTimeZone="UTC" />);

    await openPicker(user);
    await user.click(screen.getByRole('button', { name: /Timezone/ }));
    expect(await screen.findByText('Your timezone')).toBeInTheDocument();
  });

  it('announces the timezone list as a dialog', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker showTimeZone defaultTimeZone="Europe/Bucharest" />);

    await openPicker(user);
    const trigger = screen.getByRole('button', { name: /Timezone.*Bucharest/ });
    // The popup is a dialog holding a search box and its list, not a bare listbox.
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Timezones' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute(
      'aria-controls',
      screen.getByRole('dialog', { name: 'Timezones' }).id
    );
  });
});

describe('DateTimePicker uncontrolled timezone', () => {
  it('keeps the picked date when the zone changes without a value prop', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <DateTimePicker
        showTimeZone
        defaultTimeZone="Europe/Bucharest"
        onValueChange={handleChange}
        calendarProps={{ defaultMonth: new Date(2024, 5, 1) }}
      />
    );

    await openPicker(user);
    await user.click(screen.getByText('15'));
    await choose(user, 'Hour', '14');
    await user.click(screen.getByRole('button', { name: /Timezone.*Bucharest/ }));
    await user.type(screen.getByPlaceholderText('Search city, region or offset'), 'tokyo');
    await user.click(await screen.findByRole('option', { name: /Tokyo/ }));

    // 14:00 in Tokyo is 05:00Z, and the field still shows the picked date and time.
    expect(handleChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2024, 5, 15, 5, 0)));
    expect(screen.getAllByRole('button')[0]).toHaveTextContent('June 15th, 2024 at 14:00 GMT+9');
  });

  it('clears the time when a controlled value is cleared', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} />);
    rerender(<DateTimePicker value={undefined} />);

    await openPicker(user);
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('--');
    expect(screen.getByRole('combobox', { name: 'Minute' })).toHaveTextContent('--');
  });
});

describe('DateTimePicker in an input group', () => {
  it("is the enclosing group's control, with no box of its own", () => {
    render(
      <InputGroup>
        <DateTimePicker id="when" placeholder="Pick a time" />
      </InputGroup>
    );
    const trigger = screen.getByText('Pick a time').closest('button');
    expect(trigger).toHaveAttribute('data-slot', 'input-group-control');
    expect(trigger).not.toHaveClass('future:bg-surface-overlay');
  });

  it('opens its panel against the group box', async () => {
    const user = userEvent.setup();
    render(
      <InputGroup data-testid="box">
        <DateTimePicker id="when" placeholder="Pick a time" />
      </InputGroup>
    );
    const measure = vi.spyOn(screen.getByTestId('box'), 'getBoundingClientRect');

    await user.click(screen.getByText('Pick a time'));
    await waitFor(() => expect(measure).toHaveBeenCalled());
  });
});

describe('DateTimePicker display across daylight saving', () => {
  it('shows the zone’s time even when the browser’s zone skips that hour', () => {
    const original = process.env.TZ;
    // 03:30 on 31 March 2024 does not exist in Bucharest (clocks jump 03:00 to 04:00), but it
    // does in Tokyo: 03:30 Tokyo is 18:30Z the day before.
    process.env.TZ = 'Europe/Bucharest';
    try {
      render(
        <DateTimePicker value={new Date(Date.UTC(2024, 2, 30, 18, 30))} timeZone="Asia/Tokyo" />
      );
      expect(screen.getByRole('button')).toHaveTextContent('March 31st, 2024 at 03:30 GMT+9');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('DateTimePicker review fixes', () => {
  it('keeps the seconds when only the day changes, and resets them with a new time', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <DateTimePicker
        value={new Date(Date.UTC(2024, 5, 15, 14, 30, 45, 250))}
        timeZone="UTC"
        onValueChange={handleChange}
      />
    );

    await openPicker(user);
    await user.click(screen.getByText('20'));
    expect(handleChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2024, 5, 20, 14, 30, 45, 250)));

    await choose(user, 'Minute', '45');
    expect(handleChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2024, 5, 20, 14, 45, 0, 0)));
  });

  it('falls back to the browser zone and warns for an unknown timeZone', () => {
    const original = process.env.TZ;
    process.env.TZ = 'Asia/Tokyo';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <DateTimePicker
          value={new Date(Date.UTC(2024, 5, 15, 5, 0))}
          timeZone="Europe/Bucharestt"
        />
      );
      // 05:00Z read in Tokyo, not as UTC.
      expect(screen.getByRole('button')).toHaveTextContent('June 15th, 2024 at 14:00 GMT+9');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Europe/Bucharestt'));
    } finally {
      warn.mockRestore();
      process.env.TZ = original;
    }
  });

  it('lets Clear remove a time picked before any day', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker />);

    await openPicker(user);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await choose(user, 'Hour', '09');
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear).toBeEnabled();

    await user.click(clear);
    await openPicker(user);
    expect(screen.getByRole('combobox', { name: 'Hour' })).toHaveTextContent('--');
  });
});
