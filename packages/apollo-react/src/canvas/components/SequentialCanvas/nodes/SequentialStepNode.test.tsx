import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { SequentialStepNode } from './SequentialStepNode';

// Keep the wrapper test lightweight and free of the registry / ReactFlow
// context BaseNode's bar variant needs.
vi.mock('../../BaseNode/BaseNode', () => ({
  BaseNode: ({ renderVariant }: { renderVariant?: string }) => (
    <div data-testid="base-node" data-render-variant={renderVariant} />
  ),
}));

// Minimal NodeProps stand-in for a focused wrapper test.
// biome-ignore lint/suspicious/noExplicitAny: minimal NodeProps stub for a focused render test.
const nodeProps = { id: 'leaf-a', data: {} } as any;

describe('SequentialStepNode', () => {
  it('renders only the BaseNode bar; branch insertion lives in placeholder rows', () => {
    render(
      <BaseCanvasModeProvider mode="design">
        <SequentialStepNode {...nodeProps} />
      </BaseCanvasModeProvider>
    );

    expect(screen.getByTestId('base-node')).toHaveAttribute('data-render-variant', 'bar');
    expect(screen.queryByRole('button', { name: 'Add step' })).not.toBeInTheDocument();
  });
});
