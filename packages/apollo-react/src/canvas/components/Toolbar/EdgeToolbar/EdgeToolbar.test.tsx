import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EdgeToolbar } from './EdgeToolbar';
import type { EdgeToolbarConfig } from './EdgeToolbar.types';

vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const config: EdgeToolbarConfig = {
  actions: [
    { id: 'add', label: 'Add', onAction: vi.fn() },
    { id: 'delete', label: 'Delete', icon: 'trash-2', onAction: vi.fn() },
  ],
};
const BESIDE_VERTICAL_RUN = { pathPosition: { x: 0, y: 0 }, offsetPosition: { x: 24, y: 0 } };
const ABOVE_HORIZONTAL_RUN = { pathPosition: { x: 0, y: 0 }, offsetPosition: { x: 0, y: -24 } };

const toolbar = () => screen.getByRole('button', { name: 'Add' }).parentElement as HTMLElement;

describe('EdgeToolbar layout', () => {
  it('lays buttons out in a row by default, even beside a vertical run', () => {
    render(<EdgeToolbar edgeId="e1" visible positioning={BESIDE_VERTICAL_RUN} config={config} />);

    expect(toolbar()).toHaveClass('flex-row');
  });

  it('stacks buttons beside a vertical run for layout="along-path"', () => {
    render(
      <EdgeToolbar
        edgeId="e1"
        visible
        positioning={BESIDE_VERTICAL_RUN}
        config={config}
        layout="along-path"
      />
    );

    expect(toolbar()).toHaveClass('flex-col');
  });

  it('keeps a row above a horizontal run for layout="along-path"', () => {
    render(
      <EdgeToolbar
        edgeId="e1"
        visible
        positioning={ABOVE_HORIZONTAL_RUN}
        config={config}
        layout="along-path"
      />
    );

    expect(toolbar()).toHaveClass('flex-row');
  });
});
