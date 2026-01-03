import { type ReactFlowState, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

const reactFlowPortalSelector = (state: ReactFlowState) =>
  state.domNode?.querySelector('.react-flow__renderer');

export interface CanvasPortalProps {
  children: ReactNode;
}

export function CanvasPortal({ children }: CanvasPortalProps) {
  const wrapperRef = useStore(reactFlowPortalSelector);

  if (!wrapperRef) {
    return null;
  }

  return createPortal(children, wrapperRef);
}
