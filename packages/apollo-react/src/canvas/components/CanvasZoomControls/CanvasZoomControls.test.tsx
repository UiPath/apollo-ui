import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasZoomControls, type TidyUpMenuOption } from './CanvasZoomControls';

const OPTIONS: TidyUpMenuOption[] = [
  { id: 'all', label: 'Tidy up nodes', shortcut: '⌘⇧L' },
  { id: 'subtle', label: 'Subtle align', disabled: true },
  { id: 'reset', label: 'Reset', separatorBefore: true },
];

function renderControls(props: Parameters<typeof CanvasZoomControls>[0]) {
  return render(
    <ReactFlowProvider>
      <CanvasZoomControls {...props} />
    </ReactFlowProvider>
  );
}

describe('CanvasZoomControls', () => {
  it('hides Tidy up when neither onOrganize nor tidyUpOptions is provided', () => {
    renderControls({});
    expect(screen.queryByTestId('organize-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tidy-up-menu-button')).not.toBeInTheDocument();
  });

  it('runs onOrganize directly as a single action', async () => {
    const onOrganize = vi.fn();
    renderControls({ onOrganize });
    await userEvent.click(screen.getByTestId('organize-button'));
    expect(onOrganize).toHaveBeenCalledOnce();
  });

  it('opens a menu of strategies when tidyUpOptions is provided', async () => {
    const onOrganize = vi.fn();
    const onTidyUpSelect = vi.fn();
    renderControls({ onOrganize, tidyUpOptions: OPTIONS, onTidyUpSelect });

    expect(screen.queryByTestId('organize-button')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('tidy-up-menu-button'));

    expect(screen.getByTestId('tidy-up-option-all')).toHaveTextContent('⌘⇧L');
    expect(screen.getByTestId('tidy-up-option-subtle')).toHaveAttribute('data-disabled');

    await userEvent.click(screen.getByTestId('tidy-up-option-all'));
    expect(onTidyUpSelect).toHaveBeenCalledWith('all');
    expect(onOrganize).not.toHaveBeenCalled();
  });

  it('falls back to onOrganize when tidyUpOptions is empty', () => {
    renderControls({ onOrganize: vi.fn(), tidyUpOptions: [] });
    expect(screen.getByTestId('organize-button')).toBeInTheDocument();
  });

  it('uses the organize label override for the menu trigger', () => {
    renderControls({ tidyUpOptions: OPTIONS, labels: { organize: 'Organize' } });
    expect(screen.getByTestId('tidy-up-menu-button')).toHaveAttribute('aria-label', 'Organize');
  });
});
