import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PopoverSelect, type PopoverSelectProps } from './PopoverSelect';

afterEach(cleanup);

const OPTIONS = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
];

const Harness = ({ returnFocus }: Pick<PopoverSelectProps, 'returnFocus'>) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('a');
  return (
    <div>
      <PopoverSelect
        value={value}
        options={OPTIONS}
        onChange={setValue}
        open={open}
        onOpenChange={setOpen}
        returnFocus={returnFocus}
        container={document.body}
        label="Letter"
        dataTestId="select"
      />
      <input aria-label="Target" />
      <input aria-label="Disabled" disabled />
      <div
        data-testid="wrap"
        tabIndex={-1}
        onFocus={(event) => {
          if (event.target === event.currentTarget)
            event.currentTarget.querySelector('input')?.focus();
        }}
      >
        <input aria-label="Inner" />
      </div>
    </div>
  );
};

const pick = (name: string) => {
  fireEvent.click(screen.getByRole('combobox', { name: 'Letter' }));
  const option = screen.getByRole('option', { name });
  option.focus();
  fireEvent.click(option);
};

describe('PopoverSelect focus on close', () => {
  it('focuses the target the host names once a pick closes the list', async () => {
    const target = vi.fn(() => document.querySelector<HTMLElement>('input'));
    render(<Harness returnFocus={target} />);
    pick('Beta');
    await waitFor(() => expect(target).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Target' }));
  });

  it('focuses its trigger once a pick closes the list and the host names no target', async () => {
    const target = vi.fn(() => null);
    render(<Harness returnFocus={target} />);
    pick('Beta');
    await waitFor(() => expect(target).toHaveBeenCalledTimes(1));
    const trigger = screen.getByRole('combobox', { name: 'Letter' });
    expect(trigger).toHaveTextContent('Beta');
    expect(document.activeElement).toBe(trigger);
  });

  it('focuses its trigger once a pick closes the list and the target the host names is off the page', async () => {
    const target = vi.fn(() => document.createElement('input'));
    render(<Harness returnFocus={target} />);
    pick('Beta');
    await waitFor(() => expect(target).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Letter' }));
  });

  it('focuses its trigger once the list closes and the target the host names cannot take focus', async () => {
    const target = vi.fn(() => document.querySelector<HTMLElement>('input[disabled]'));
    render(<Harness returnFocus={target} />);
    pick('Beta');
    await waitFor(() => expect(target).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Letter' }));
  });

  it('focuses the target the host names inside a shadow root', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const inner = document.createElement('input');
    host.attachShadow({ mode: 'open' }).appendChild(inner);
    render(<Harness returnFocus={() => inner} />);
    pick('Beta');
    await waitFor(() => expect(host.shadowRoot?.activeElement).toBe(inner));
    host.remove();
  });

  it('leaves focus where the target the host names passes it on', async () => {
    const target = vi.fn(() => screen.getByTestId('wrap'));
    render(<Harness returnFocus={target} />);
    pick('Beta');
    await waitFor(() => expect(target).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Inner' }));
  });
});
