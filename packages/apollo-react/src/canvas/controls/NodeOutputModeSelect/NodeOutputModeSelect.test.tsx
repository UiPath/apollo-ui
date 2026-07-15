import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { NodeOutputModeSelect } from './NodeOutputModeSelect';

describe('NodeOutputModeSelect', () => {
  it('announces options as radio items with the selected mode checked', async () => {
    render(<NodeOutputModeSelect value="static" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Node mode' }));
    const selected = screen.getByRole('menuitemradio', { name: /Static mock/ });
    expect(selected).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: /Live/ })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('reports the chosen mode through onChange', async () => {
    const onChange = vi.fn();
    render(<NodeOutputModeSelect value="live" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Node mode' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /Simulated/ }));
    expect(onChange).toHaveBeenCalledWith('simulated');
  });

  it('renders custom options and falls back to the first when the value is unknown', async () => {
    const options = [
      { value: 'Live', label: 'Live!' },
      { value: 'Static', label: 'Static!' },
    ];
    render(<NodeOutputModeSelect value="nope" onChange={vi.fn()} options={options} />);
    expect(screen.getByRole('button', { name: 'Node mode' })).toHaveTextContent('Live!');
    // The dropdown checks the same fallback option the trigger shows, so an
    // unknown value never leaves the radio group with nothing checked.
    await userEvent.click(screen.getByRole('button', { name: 'Node mode' }));
    expect(screen.getByRole('menuitemradio', { name: 'Live!' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('disables the trigger', () => {
    render(<NodeOutputModeSelect value="live" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Node mode' })).toBeDisabled();
  });
});
