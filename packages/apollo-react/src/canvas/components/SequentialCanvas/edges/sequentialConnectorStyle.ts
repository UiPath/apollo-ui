import type { SequenceConnectorKind } from '../../../utils/sequential/sequential.types';
import type { EdgeStrokeStyle } from '../../Edges/shared/types';

/**
 * Maps a connector kind to its stroke style.
 *
 * - `step` / `branch-entry` are part of the structural spine: solid.
 * - `merge-back` / `goto` are the "degrade" rejoin/reference connectors and
 *   read as secondary: dashed (D9).
 */
export function resolveConnectorStrokeStyle(kind: SequenceConnectorKind): EdgeStrokeStyle {
  return kind === 'merge-back' || kind === 'goto' ? 'dashed' : 'solid';
}
