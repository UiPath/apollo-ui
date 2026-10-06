import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { TimeZoneSelect } from './timezone-select';

// The zones a runtime with legacy ids lists, so the test doesn't depend on which spelling the
// test runtime's ICU reports. `getZoneGroups` builds once per module, on the first open.
const original = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf');
Object.defineProperty(Intl, 'supportedValuesOf', {
  configurable: true,
  value: () => ['Asia/Calcutta', 'Europe/Kiev', 'Europe/Bucharest', 'America/New_York'],
});
afterAll(() => {
  if (original) Object.defineProperty(Intl, 'supportedValuesOf', original);
  else delete (Intl as { supportedValuesOf?: unknown }).supportedValuesOf;
});

const isChecked = (option: HTMLElement) =>
  option.querySelector('svg')?.classList.contains('opacity-100') ?? false;

async function openAndSearch(user: ReturnType<typeof userEvent.setup>, query: string) {
  await user.click(screen.getByRole('button'));
  await user.click(screen.getByPlaceholderText('Search city, region or offset'));
  await user.paste(query);
}

describe('TimeZoneSelect renamed zones', () => {
  it.each([
    ['Asia/Kolkata', 'Asia/Calcutta', 'kolkata', /Kolkata/],
    ['Europe/Kyiv', 'Europe/Kiev', 'kyiv', /Kyiv/],
  ])('checks the listed %s row, listed as %s', async (value, listed, query, name) => {
    const user = userEvent.setup();
    render(<TimeZoneSelect value={value} onChange={vi.fn()} />);

    await openAndSearch(user, query);
    const option = await screen.findByRole('option', { name });
    expect(option).toHaveAttribute('title', listed);
    expect(isChecked(option)).toBe(true);
  });

  it('checks the listed row for an alias the list leaves out, and keeps the alias', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // `US/Eastern` is a valid id, but runtimes list only `America/New_York`.
    render(<TimeZoneSelect value="US/Eastern" onChange={onChange} />);

    await openAndSearch(user, 'new york');
    const option = await screen.findByRole('option', { name: /New York/ });
    expect(isChecked(option)).toBe(true);
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith('US/Eastern');
  });

  it('leaves other zones unchecked', async () => {
    const user = userEvent.setup();
    render(<TimeZoneSelect value="Asia/Kolkata" onChange={vi.fn()} />);

    await openAndSearch(user, 'europe');
    expect(isChecked(await screen.findByRole('option', { name: /Kyiv/ }))).toBe(false);
  });

  it('keeps the value’s spelling when its own zone is picked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeZoneSelect value="Asia/Kolkata" onChange={onChange} />);

    await openAndSearch(user, 'kolkata');
    await user.click(await screen.findByRole('option', { name: /Kolkata/ }));
    expect(onChange).toHaveBeenCalledWith('Asia/Kolkata');
  });

  it('emits the listed id for a different zone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeZoneSelect value="Asia/Kolkata" onChange={onChange} />);

    await openAndSearch(user, 'kyiv');
    await user.click(await screen.findByRole('option', { name: /Kyiv/ }));
    expect(onChange).toHaveBeenCalledWith('Europe/Kiev');
  });
});

describe('TimeZoneSelect offsets without at', () => {
  it('reads offsets at the moment the list opens', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      // Bucharest is GMT+2 in winter and GMT+3 in summer.
      vi.setSystemTime(new Date(Date.UTC(2024, 0, 15)));
      const user = userEvent.setup();
      render(<TimeZoneSelect value="Europe/Bucharest" onChange={vi.fn()} />);
      expect(screen.getByRole('button')).toHaveTextContent('GMT+2');

      // Still mounted after the change to summer time, as a long-lived picker would be.
      vi.setSystemTime(new Date(Date.UTC(2024, 6, 15)));
      await openAndSearch(user, 'bucharest');
      expect(await screen.findByRole('option', { name: /Bucharest/ })).toHaveTextContent('GMT+3');
      expect(screen.getByRole('button', { name: /Bucharest/ })).toHaveTextContent('GMT+3');
    } finally {
      vi.useRealTimers();
    }
  });
});
