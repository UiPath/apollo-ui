import { DropdownMenuItem } from '@uipath/apollo-wind';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { NodePropertyTrigger, NodePropertyTriggerCheckboxItem } from './NodePropertyTrigger';

const BEHAVIOR_OPTIONS = [
  { value: 'auto-hide' as const, label: 'Auto hide' },
  { value: 'always-persist' as const, label: 'Always persist' },
];

const LAYOUT_OPTIONS = [{ value: 'right' as const, label: 'Right' }];

function setup(props: React.ComponentProps<typeof NodePropertyTrigger> = {}) {
  const user = userEvent.setup();
  const utils = render(
    <NodePropertyTrigger
      behaviorOptions={BEHAVIOR_OPTIONS}
      layoutOptions={LAYOUT_OPTIONS}
      {...props}
    />
  );
  return { user, ...utils };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Panel options' }));
}

describe('NodePropertyTrigger', () => {
  it('renders closed by default', () => {
    setup();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the popover when the sliders button is clicked', async () => {
    const { user } = setup();
    await openMenu(user);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the popover when the sliders button is clicked again', async () => {
    const { user } = setup();
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Panel options' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets aria-expanded correctly as the menu toggles', async () => {
    const { user } = setup();
    const btn = screen.getByRole('button', { name: 'Panel options' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(screen.getByRole('button', { name: 'Panel options' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('closes the popover on an outside click', async () => {
    const { user } = setup();
    await openMenu(user);
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the popover when Escape is pressed', async () => {
    const { user } = setup();
    await openMenu(user);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onBehaviorChange with the selected value and closes the menu', async () => {
    const onBehaviorChange = vi.fn();
    const { user } = setup({ onBehaviorChange });
    await openMenu(user);
    await user.click(screen.getByRole('menuitemradio', { name: 'Always persist' }));
    expect(onBehaviorChange).toHaveBeenCalledWith('always-persist');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onLayoutChange with the selected value and closes the menu', async () => {
    const onLayoutChange = vi.fn();
    const { user } = setup({ onLayoutChange });
    await openMenu(user);
    await user.click(screen.getByRole('menuitemradio', { name: 'Right' }));
    expect(onLayoutChange).toHaveBeenCalledWith('right');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('marks the active behavior with aria-checked', async () => {
    const { user } = setup({ behavior: 'always-persist' });
    await openMenu(user);
    expect(screen.getByRole('menuitemradio', { name: 'Always persist' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Auto hide' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('calls onPanelToggle with the panel label and toggled enabled state', async () => {
    const onPanelToggle = vi.fn();
    const { user } = setup({
      panels: [{ label: 'Inspector', enabled: false }],
      onPanelToggle,
    });
    await openMenu(user);
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Inspector' }));
    expect(onPanelToggle).toHaveBeenCalledWith('Inspector', true);
  });

  it('passes the panel id (not the label) to onPanelToggle when an id is supplied', async () => {
    const onPanelToggle = vi.fn();
    const { user } = setup({
      panels: [{ id: 'inputs', label: 'Input', enabled: false }],
      onPanelToggle,
    });
    await openMenu(user);
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Input' }));
    expect(onPanelToggle).toHaveBeenCalledWith('inputs', true);
  });

  it('keeps the menu open after a panel toggle so several panels can be toggled in one visit', async () => {
    const { user } = setup({
      panels: [{ label: 'Inspector', enabled: false }],
      onPanelToggle: vi.fn(),
    });
    await openMenu(user);
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Inspector' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('calls onPresetApply when a preset is clicked and closes the menu', async () => {
    const onPresetApply = vi.fn();
    const { user } = setup({
      presets: [{ id: 'p1', label: 'Compact' }],
      onPresetApply,
    });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /Compact/ }));
    expect(onPresetApply).toHaveBeenCalledWith({ id: 'p1', label: 'Compact' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onPresetDelete with the preset id and keeps the menu open', async () => {
    const onPresetDelete = vi.fn();
    const { user } = setup({
      presets: [{ id: 'p1', label: 'Compact' }],
      onPresetDelete,
    });
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Delete preset' }));
    expect(onPresetDelete).toHaveBeenCalledWith('p1');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('calls onPropertiesClick when the label button is clicked', async () => {
    const onPropertiesClick = vi.fn();
    const { user } = setup({ onPropertiesClick, label: 'Properties' });
    await user.click(screen.getByRole('button', { name: 'Properties' }));
    expect(onPropertiesClick).toHaveBeenCalledTimes(1);
  });

  it('shows the Save as preset button only when canSavePreset is true', async () => {
    const { user } = setup({ canSavePreset: true });
    await openMenu(user);
    expect(screen.getByRole('menuitem', { name: /save as preset/i })).toBeInTheDocument();
  });

  it('calls onSavePreset when Save as preset is clicked', async () => {
    const onSavePreset = vi.fn();
    const { user } = setup({ canSavePreset: true, onSavePreset });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: /save as preset/i }));
    expect(onSavePreset).toHaveBeenCalledTimes(1);
  });

  it('renders a plain label pill without divider or sliders button when showMenu is false', () => {
    setup({ showMenu: false, label: 'Variables' });
    expect(screen.getByRole('button', { name: 'Variables' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Panel options' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders consumer-composed children instead of the built-in sections', async () => {
    const onSelect = vi.fn();
    const { user } = setup({
      panels: [{ label: 'Inspector' }],
      children: (
        <>
          <NodePropertyTriggerCheckboxItem checked onCheckedChange={() => {}}>
            Custom toggle
          </NodePropertyTriggerCheckboxItem>
          <DropdownMenuItem onSelect={onSelect}>Custom action</DropdownMenuItem>
        </>
      ),
    });
    await openMenu(user);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Custom toggle' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Inspector' })).not.toBeInTheDocument();
    expect(screen.queryByText('Panel behavior')).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Custom action' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('collapses the layouts section (heading included) when layoutOptions is empty', async () => {
    const { user } = setup({ layoutOptions: [] });
    await openMenu(user);
    expect(screen.queryByText('Default layouts')).not.toBeInTheDocument();
    expect(screen.getByText('Panel behavior')).toBeInTheDocument();
  });

  it('collapses the behavior section (heading included) when behaviorOptions is empty', async () => {
    const { user } = setup({ behaviorOptions: [] });
    await openMenu(user);
    expect(screen.queryByText('Panel behavior')).not.toBeInTheDocument();
    expect(screen.getByText('Default layouts')).toBeInTheDocument();
  });

  it('collapses the presets section when there are no presets and canSavePreset is false', async () => {
    const { user } = setup();
    await openMenu(user);
    expect(screen.queryByText('Saved presets')).not.toBeInTheDocument();
    expect(screen.queryByText('No saved presets yet.')).not.toBeInTheDocument();
  });

  it('keeps the presets empty state when canSavePreset is true', async () => {
    const { user } = setup({ canSavePreset: true });
    await openMenu(user);
    expect(screen.getByText('Saved presets')).toBeInTheDocument();
    expect(screen.getByText('No saved presets yet.')).toBeInTheDocument();
  });

  it('clamps the uncontrolled selection when the options change and no longer contain it', async () => {
    const { user, rerender } = setup();
    await openMenu(user);
    // Uncontrolled: select the second option, then swap the option set.
    await user.click(screen.getByRole('menuitemradio', { name: 'Always persist' }));
    rerender(
      <NodePropertyTrigger
        behaviorOptions={[
          { value: 'pinned', label: 'Pinned' },
          { value: 'floating', label: 'Floating' },
        ]}
        layoutOptions={LAYOUT_OPTIONS}
      />
    );
    await openMenu(user);
    expect(screen.getByRole('menuitemradio', { name: 'Pinned' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Floating' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('supports controlled open state', () => {
    const onOpenChange = vi.fn();
    const { rerender } = setup({ open: true, onOpenChange });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    rerender(
      <NodePropertyTrigger
        behaviorOptions={BEHAVIOR_OPTIONS}
        layoutOptions={LAYOUT_OPTIONS}
        open={false}
        onOpenChange={onOpenChange}
      />
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
