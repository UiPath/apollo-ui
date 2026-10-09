import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  PanelTabs,
  PanelTabsContent,
  PanelTabsList,
  PanelTabsStrip,
  PanelTabsTrigger,
} from './panel-tabs';

function Panel({ padded }: { padded?: boolean }) {
  return (
    <PanelTabs defaultValue="parameters">
      <PanelTabsList trailing={<button type="button">Notes</button>}>
        <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
        <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
      </PanelTabsList>
      <PanelTabsContent value="parameters" padded={padded}>
        <p>Parameters body</p>
      </PanelTabsContent>
      <PanelTabsContent value="advanced">
        <p>Advanced body</p>
      </PanelTabsContent>
    </PanelTabs>
  );
}

describe('PanelTabs', () => {
  it('switches tabs and keeps the trailing content in the tab row', async () => {
    const user = userEvent.setup();
    render(<Panel />);

    expect(screen.getByText('Parameters body')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Advanced' }));
    expect(screen.getByText('Advanced body')).toBeInTheDocument();

    const row = screen.getByRole('tablist').closest('[data-slot="panel-tabs-list"]');
    expect(row).toContainElement(screen.getByRole('button', { name: 'Notes' }));
  });

  it('owns the panel spacing: inset row, and content 12px below the tabs', () => {
    render(<Panel />);

    const row = screen.getByRole('tablist').closest('[data-slot="panel-tabs-list"]');
    expect(row).toHaveClass('pt-3', 'pb-0.5', '[padding-inline:var(--mf-content-inset,0px)]');
    // The strip is flush, so rows that share it with other controls keep their height.
    expect(screen.getByRole('tablist')).toHaveClass('p-0');
    expect(screen.getByText('Parameters body').parentElement).toHaveClass(
      'pt-1.5',
      '[padding-inline:var(--mf-content-inset,0px)]'
    );
  });

  it('leaves the padding to content that pads itself', () => {
    render(<Panel padded={false} />);

    expect(screen.getByText('Parameters body').parentElement).toHaveAttribute(
      'data-slot',
      'panel-tabs-content'
    );
  });

  it('offers the strip alone for rows that hold other controls', () => {
    render(
      <PanelTabs defaultValue="a">
        <div data-testid="toolbar-row">
          <PanelTabsStrip>
            <PanelTabsTrigger value="a">A</PanelTabsTrigger>
          </PanelTabsStrip>
        </div>
      </PanelTabs>
    );

    expect(screen.getByTestId('toolbar-row')).toContainElement(screen.getByRole('tablist'));
    expect(screen.getByRole('tablist').closest('[data-slot="panel-tabs-list"]')).toBeNull();
    // Sized to its tabs, so a search that expands next to it keeps its width.
    expect(screen.getByRole('tablist').closest('[data-slot="scrollable-tabs-list"]')).toHaveClass(
      'w-auto'
    );
  });
});
