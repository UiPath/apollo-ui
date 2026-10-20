import { createContext, type ReactNode, useContext } from 'react';
import type { BaseNodeBarAttachment } from '../BaseNode/BaseNodeBar';

export type SequentialAttachmentsByStepId = ReadonlyMap<string, BaseNodeBarAttachment[]>;

const EMPTY_ATTACHMENTS: SequentialAttachmentsByStepId = new Map();

const SequentialAttachmentsContext =
  createContext<SequentialAttachmentsByStepId>(EMPTY_ATTACHMENTS);

export interface SequentialAttachmentsProviderProps {
  children: ReactNode;
  attachmentsByStepId: SequentialAttachmentsByStepId;
}

/**
 * Carries each step's artifact-attached resources (tools, context, memory) down to
 * SequentialStepNode without touching node `data`, which is a by-reference passthrough
 * from the canonical node.
 */
export function SequentialAttachmentsProvider({
  children,
  attachmentsByStepId,
}: SequentialAttachmentsProviderProps) {
  return (
    <SequentialAttachmentsContext.Provider value={attachmentsByStepId}>
      {children}
    </SequentialAttachmentsContext.Provider>
  );
}

/** The step's attachments; undefined when it has none or outside a provider. */
export function useSequentialAttachments(nodeId: string): BaseNodeBarAttachment[] | undefined {
  return useContext(SequentialAttachmentsContext).get(nodeId);
}
