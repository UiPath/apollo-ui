import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import type { BaseNodeBarAttachment } from '../../BaseNode/BaseNodeBar';
import { SequentialAttachmentsProvider } from '../SequentialAttachmentsContext';
import { SequentialStepNode } from './SequentialStepNode';

// Stub the bar renderer so the wrapper test needs no registry or ReactFlow context.
vi.mock('../../BaseNode/BaseNodeBarNode', () => ({
  BaseNodeBarNode: ({ attachments }: { attachments?: BaseNodeBarAttachment[] }) => (
    <div data-testid="base-node-bar" data-attachments={attachments?.map((a) => a.id).join(',')} />
  ),
}));

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

  it('passes the step attachments from context to the bar', () => {
    const attachments = new Map<string, BaseNodeBarAttachment[]>([
      [
        'leaf-a',
        [
          { id: 'tool-1', label: 'Search', handleId: 'tools' },
          { id: 'memory-1', label: 'Memory', handleId: 'memory' },
        ],
      ],
      ['other', [{ id: 'tool-2', label: 'Other tool' }]],
    ]);

    render(
      <BaseCanvasModeProvider mode="design">
        <SequentialAttachmentsProvider attachmentsByStepId={attachments}>
          <SequentialStepNode {...nodeProps} />
        </SequentialAttachmentsProvider>
      </BaseCanvasModeProvider>
    );

    expect(screen.getByTestId('base-node-bar')).toHaveAttribute(
      'data-attachments',
      'tool-1,memory-1'
    );
  });
});
