import type { SequenceConnectorKind } from '../../../utils/sequential/sequential.types';
import type { EdgeStrokeStyle } from '../../Edges/shared/types';

/**
 * Maps a connector kind to its stroke style.
 *
 * - `step` / `branch-entry` / `merge-back` are all structural control flow:
 *   solid.
 * - `goto` is an irregular reference (cycle or already-visited target): dashed.
 * - transient preview connectors are handled by SequentialConnectorEdge and
 *   remain dashed independently of this mapping.
 */
export function resolveConnectorStrokeStyle(kind: SequenceConnectorKind): EdgeStrokeStyle {
  return kind === 'goto' ? 'dashed' : 'solid';
}
