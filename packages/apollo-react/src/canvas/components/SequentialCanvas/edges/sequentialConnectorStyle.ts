import type { SequenceConnectorKind } from '../../../utils/sequential/sequential.types';
import type { EdgeStrokeStyle } from '../../Edges/shared/types';

/**
 * Stroke style by connector kind: only irregular `goto` references are dashed.
 * Transient previews are dashed by SequentialConnectorEdge itself.
 */
export function resolveConnectorStrokeStyle(kind: SequenceConnectorKind): EdgeStrokeStyle {
  return kind === 'goto' ? 'dashed' : 'solid';
}
