import type { SequenceConnectorKind } from '../../../utils/sequential/sequential.types';
import type { EdgeStrokeStyle } from '../../Edges/shared/types';

/**
 * Maps a connector kind to its stroke style.
 *
 * - `step` / `branch-entry` are part of the structural spine: solid.
 * - branch `merge-back` / `goto` connectors are secondary rejoins/references:
 *   dashed (D9).
 * - a straight `merge-back` is a structural container's ordinary continuation
 *   and reads like the equivalent While continuation: solid.
 */
export function resolveConnectorStrokeStyle(
  kind: SequenceConnectorKind,
  options?: { straightContainerContinuation?: boolean }
): EdgeStrokeStyle {
  if (kind === 'merge-back' && options?.straightContainerContinuation) return 'solid';
  return kind === 'merge-back' || kind === 'goto' ? 'dashed' : 'solid';
}
