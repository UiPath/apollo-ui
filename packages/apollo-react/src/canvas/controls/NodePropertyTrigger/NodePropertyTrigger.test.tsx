import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { NodePropertyTrigger } from './NodePropertyTrigger';

const BEHAVIOR_OPTIONS = [
  { value: 'auto-hide' as const, label: 'Auto hide' },
  { value: 'always-persist' as const, label: 'Always persist' },
];

const LAYOUT_OPTIONS = [
  { value: 'right' as const, label: 'Right' },
];

function setup(props: React.ComponentProps<typeof NodePropertyTrigger> = {}) {
  // Provide a stable bounding rect so position calculation doesn't throw
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: 100, top: 80, right: 300, left: 200,
    width: 100, height: 20, x: 200, y: 80,
    toJSON: () => ({}),
  } as DOMRect);
  return render(
    <NodePropertyTrigger
      behaviorOptions={BEHAVIOR_OPTIONS}
      layoutOptions={LAYOUT_OPTIONS}
      {...props}
    />
  );
}

describe('NodePropertyTrigger', () => {
  it('renders closed by default', () => {
    setup();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the popover when the sliders button is clicked', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the popover when the sliders button is clicked again', async () => {
    setup();
    const btn = screen.getByRole('button', { name: 'Panel options' });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets aria-expanded correctly as the menu toggles', async () => {
    setup();
    const btn = screen.getByRole('button', { name: 'Panel options' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the popover on an outside pointerdown', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not close when pointerdown fires inside the portalled menu', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    const menu = screen.getByRole('menu');
    fireEvent.pointerDown(menu);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the popover on window scroll', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    fireEvent.scroll(window);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the popover on window resize', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    fireEvent(window, new Event('resize'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onBehaviorChange with the selected value and closes the menu', async () => {
    const onBehaviorChange = vi.fn();
    setup({ onBehaviorChange });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Always persist' }));
    expect(onBehaviorChange).toHaveBeenCalledWith('always-persist');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onLayoutChange with the selected value and closes the menu', async () => {
    const onLayoutChange = vi.fn();
    setup({ onLayoutChange });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Right' }));
    expect(onLayoutChange).toHaveBeenCalledWith('right');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onPanelToggle with the panel label and toggled enabled state', async () => {
    const onPanelToggle = vi.fn();
    setup({
      panels: [{ label: 'Inspector', enabled: false }],
      onPanelToggle,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Inspector' }));
    expect(onPanelToggle).toHaveBeenCalledWith('Inspector', true);
  });

  it('calls onPresetApply when a preset label is clicked and closes the menu', async () => {
    const onPresetApply = vi.fn();
    setup({
      presets: [{ id: 'p1', label: 'Compact' }],
      onPresetApply,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compact' }));
    expect(onPresetApply).toHaveBeenCalledWith({ id: 'p1', label: 'Compact' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onPresetDelete with the preset id when the delete button is clicked', async () => {
    const onPresetDelete = vi.fn();
    setup({
      presets: [{ id: 'p1', label: 'Compact' }],
      onPresetDelete,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete preset' }));
    expect(onPresetDelete).toHaveBeenCalledWith('p1');
  });

  it('calls onPropertiesClick when the label button is clicked', async () => {
    const onPropertiesClick = vi.fn();
    setup({ onPropertiesClick, label: 'Properties' });
    await userEvent.click(screen.getByRole('button', { name: 'Properties' }));
    expect(onPropertiesClick).toHaveBeenCalledTimes(1);
  });

  it('shows the Save as preset button only when canSavePreset is true', async () => {
    setup({ canSavePreset: true });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    expect(screen.getByRole('button', { name: /save as preset/i })).toBeInTheDocument();
  });

  it('calls onSavePreset when Save as preset is clicked', async () => {
    const onSavePreset = vi.fn();
    setup({ canSavePreset: true, onSavePreset });
    await userEvent.click(screen.getByRole('button', { name: 'Panel options' }));
    await userEvent.click(screen.getByRole('button', { name: /save as preset/i }));
    expect(onSavePreset).toHaveBeenCalledTimes(1);
  });
});
