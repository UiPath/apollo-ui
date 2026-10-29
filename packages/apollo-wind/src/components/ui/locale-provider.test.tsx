import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { de } from 'react-day-picker/locale/de';
import { describe, expect, it } from 'vitest';
import { DatePicker, DateRangePicker } from './date-picker';
import { DateTimePicker } from './datetime-picker';
import { type DatePickerStrings, LocaleProvider } from './locale-provider';

const GERMAN: Partial<DatePickerStrings> = {
  pickDate: 'Datum auswählen',
  selectedDate: (date) => `Ausgewähltes Datum: ${date}`,
  selectedRange: (from, to) => `Ausgewählter Zeitraum: ${from} bis ${to}`,
  time: 'Uhrzeit',
  hours: 'Stunden',
  minutes: 'Minuten',
  clear: 'Löschen',
  done: 'Fertig',
};

const value = new Date(2024, 5, 15, 14, 30);

describe('LocaleProvider', () => {
  it('formats the DatePicker trigger and its accessible name in the language', () => {
    render(
      <LocaleProvider locale={de} datePickerStrings={GERMAN}>
        <DatePicker value={value} />
      </LocaleProvider>
    );
    const trigger = screen.getByRole('button', { name: 'Ausgewähltes Datum: 15. Juni 2024' });
    expect(trigger).toHaveTextContent('15. Juni 2024');
  });

  it('translates its placeholder', () => {
    render(
      <LocaleProvider datePickerStrings={GERMAN}>
        <DatePicker />
      </LocaleProvider>
    );
    expect(screen.getByText('Datum auswählen')).toBeInTheDocument();
  });

  it('localizes the calendar: month, weekdays, first day of the week and its own labels', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale={de}>
        <DatePicker value={value} calendarProps={{ defaultMonth: value }} />
      </LocaleProvider>
    );
    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Juni 2024')).toBeInTheDocument();
    const weekdays = screen.getByRole('grid').querySelectorAll('th[scope="col"]');
    expect(weekdays[0]).toHaveAttribute('aria-label', 'Montag');
    expect(weekdays[0]).toHaveTextContent('Mo');
    expect(screen.getByRole('button', { name: 'Zum nächsten Monat' })).toBeInTheDocument();
  });

  it('labels a range in the language', () => {
    render(
      <LocaleProvider locale={de} datePickerStrings={GERMAN}>
        <DateRangePicker value={{ from: new Date(2026, 0, 5), to: new Date(2026, 0, 9) }} />
      </LocaleProvider>
    );
    expect(
      screen.getByRole('button', {
        name: 'Ausgewählter Zeitraum: 5. Jan. 2026 bis 9. Jan. 2026',
      })
    ).toBeInTheDocument();
  });

  it("joins the DateTimePicker's date and time the language's way and translates its panel", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale={de} datePickerStrings={GERMAN}>
        <DateTimePicker value={value} />
      </LocaleProvider>
    );
    await user.click(screen.getByRole('button', { name: /15\. Juni 2024 um 14:30/ }));

    expect(screen.getByRole('group', { name: 'Uhrzeit' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Stunden' })).toHaveValue('14');
    expect(screen.getByRole('spinbutton', { name: 'Minuten' })).toHaveValue('30');
    // German uses a 24-hour clock, so there is no AM/PM choice.
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fertig' })).toBeInTheDocument();
  });

  it('loads a language given as a tag', async () => {
    render(
      <LocaleProvider locale="ja">
        <DateTimePicker value={value} />
      </LocaleProvider>
    );
    expect(await screen.findByText('2024年6月15日 14:30')).toBeInTheDocument();
  });

  it('follows the 12-hour clock of a language that uses one', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="en">
        <DateTimePicker value={value} />
      </LocaleProvider>
    );
    await user.click(await screen.findByRole('button', { name: /June 15th, 2024 at 2:30 PM/ }));
    expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveValue('02');
    expect(screen.getByRole('radio', { name: 'PM' })).toBeChecked();
  });

  it("lets a component's own locale and strings win", () => {
    render(
      <LocaleProvider locale={de} datePickerStrings={GERMAN}>
        <DatePicker value={value} locale={undefined} strings={{ pickDate: 'Choose' }} />
        <DatePicker strings={{ pickDate: 'Choose' }} />
      </LocaleProvider>
    );
    expect(screen.getByText('15. Juni 2024')).toBeInTheDocument();
    expect(screen.getByText('Choose')).toBeInTheDocument();
  });

  it("merges a nested provider's strings over the outer one's and keeps its locale", () => {
    render(
      <LocaleProvider locale={de} datePickerStrings={GERMAN}>
        <LocaleProvider datePickerStrings={{ selectedDate: (date) => `Datum: ${date}` }}>
          <DatePicker value={value} />
          <DatePicker />
        </LocaleProvider>
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: 'Datum: 15. Juni 2024' })).toBeInTheDocument();
    expect(screen.getByText('Datum auswählen')).toBeInTheDocument();
  });
});
