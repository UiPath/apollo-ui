import { FileBracesCorner } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { NodeOutputModeSelect } from './NodeOutputModeSelect';

describe('NodeOutputModeSelect', () => {
  it('announces options as radio items with the selected mode checked', async () => {
    render(<NodeOutputModeSelect value="static" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Node output mode' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Node output mode' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /Simulated/ }));
    expect(onChange).toHaveBeenCalledWith('simulated');
  });

  it('renders custom options and falls back to the first when the value is unknown', async () => {
    const options = [
      { value: 'Live', label: 'Live!' },
      { value: 'Static', label: 'Static!' },
    ];
    render(<NodeOutputModeSelect value="nope" onChange={vi.fn()} options={options} />);
    expect(screen.getByRole('button', { name: 'Node output mode' })).toHaveTextContent('Live!');
    // The dropdown checks the same fallback option the trigger shows, so an
    // unknown value never leaves the radio group with nothing checked.
    await userEvent.click(screen.getByRole('button', { name: 'Node output mode' }));
    expect(screen.getByRole('menuitemradio', { name: 'Live!' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  describe('icon shapes', () => {
    // A registry name and a Lucide component must both work: Apollo's own icons
    // (e.g. file-sparkles-corner) are not LucideIcons, so a name is the only way
    // a consumer can select one here.
    it('renders a registry icon name through CanvasIcon, in the trigger and the item', async () => {
      const options = [{ value: 'simulated', label: 'Simulated', icon: 'file-sparkles-corner' }];
      const { container } = render(
        <NodeOutputModeSelect value="simulated" onChange={vi.fn()} options={options} />
      );

      // A registry miss would degrade to Lucide's Box, so assert the real glyph.
      expect(container.querySelector('svg.file-sparkles-corner-icon')).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: 'Node output mode' }));
      const item = screen.getByRole('menuitemradio', { name: /Simulated/ });
      expect(item.querySelector('svg.file-sparkles-corner-icon')).toBeTruthy();
    });

    // The default Simulated mode uses the registry glyph, matching the canvas
    // node adornment for the same state.
    it('gives the default Simulated mode the file-sparkles-corner glyph', async () => {
      const { container } = render(<NodeOutputModeSelect value="simulated" onChange={vi.fn()} />);
      expect(container.querySelector('svg.file-sparkles-corner-icon')).toBeTruthy();

      await userEvent.click(screen.getByRole('button', { name: 'Node output mode' }));
      const item = screen.getByRole('menuitemradio', { name: /Simulated/ });
      expect(item.querySelector('svg.file-sparkles-corner-icon')).toBeTruthy();
    });

    it('still renders a Lucide component icon', () => {
      const options = [{ value: 'static', label: 'Static mock', icon: FileBracesCorner }];
      const { container } = render(
        <NodeOutputModeSelect value="static" onChange={vi.fn()} options={options} />
      );
      expect(container.querySelector('svg.lucide-file-braces-corner')).toBeTruthy();
    });

    it('carries the colour class for a name, which the registry icon inherits', () => {
      const options = [{ value: 'simulated', label: 'Simulated', icon: 'file-sparkles-corner' }];
      const { container } = render(
        <NodeOutputModeSelect value="simulated" onChange={vi.fn()} options={options} />
      );
      // Registry icons ignore className and default to currentColor, so the
      // class has to sit on a wrapper for the colour to reach the glyph.
      const glyph = container.querySelector('svg.file-sparkles-corner-icon');
      expect(glyph?.closest('.text-foreground-subtle')).toBeTruthy();
    });
  });

  it('disables the trigger', () => {
    render(<NodeOutputModeSelect value="live" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Node output mode' })).toBeDisabled();
  });
});
