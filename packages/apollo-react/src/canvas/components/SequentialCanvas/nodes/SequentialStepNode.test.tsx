import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { SequentialStepNode } from './SequentialStepNode';

// Keep the wrapper test lightweight and free of the registry / ReactFlow
// context the manifest-backed bar renderer needs.
vi.mock('../../BaseNode/BaseNodeBarNode', () => ({
  BaseNodeBarNode: () => <div data-testid="base-node-bar" />,
}));

// Minimal NodeProps stand-in for a focused wrapper test.
// biome-ignore lint/suspicious/noExplicitAny: minimal NodeProps stub for a focused render test.
const nodeProps = { id: 'leaf-a', data: {} } as any;

describe('SequentialStepNode', () => {
  it('renders only the registered bar node; branch insertion lives in placeholder rows', () => {
    render(
      <BaseCanvasModeProvider mode="design">
        <SequentialStepNode {...nodeProps} />
      </BaseCanvasModeProvider>
    );

    expect(screen.getByTestId('base-node-bar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add step' })).not.toBeInTheDocument();
  });
});
