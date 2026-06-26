import { GRID_SPACING } from '../constants';

const snapToGrid = (value: number, gridSize: number = GRID_SPACING): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Calculates handle positions that are equidistant, symmetric around the node
 * center, and use a grid-aligned spacing.
 *
 * Symmetry note: positions are placed outward from the node's true center
 * rather than snapped individually. Per-position snapping with `Math.round`
 * (round-half-up) systematically biases the entire row in one direction when
 * `startPosition` lands on a half-grid value, most visibly with even handle
 * counts and odd-multiple spacings. Computing from the center keeps handles
 * mirrored across `nodeSize / 2` even if every position ends up half a grid
 * unit off (still pixel-aligned at the gridSize granularity used here).
 *
 * @param nodeSize - The size of the node in the relevant dimension (width for Top/Bottom handles, height for Left/Right handles).
 * @param numHandles - Number of handles to position.
 * @param gridSize - The grid size for spacing.
 * @returns Array of pixel positions for each handle, symmetric around the node center.
 */
export const calculateGridAlignedHandlePositions = (
  nodeSize: number,
  numHandles: number,
  gridSize: number = GRID_SPACING
): number[] => {
  if (numHandles === 0) return [];
  if (nodeSize <= 0) return [];
  if (numHandles === 1) {
    // Snap to grid so a single handle stays aligned when `nodeSize` is odd or
    // off-grid (e.g. a 312px container would otherwise place its handle at 156).
    return [snapToGrid(nodeSize / 2, gridSize)];
  }

  const idealSpacing = nodeSize / (numHandles + 1);

  // Grid alignment is only meaningful when the node itself sits on the grid.
  // When nodeSize isn't a grid multiple, snapping spacing can't produce
  // grid-aligned positions, so just return ideal equidistant positions.
  if (nodeSize % gridSize !== 0) {
    const positions: number[] = [];
    for (let i = 0; i < numHandles; i++) {
      positions.push(idealSpacing * (i + 1));
    }
    return positions;
  }

  // Round to the nearest grid multiple, with a lower bound of one grid step so
  // handles don't all stack at the center when `idealSpacing < gridSize / 2`.
  const roundedSpacing = Math.round(idealSpacing / gridSize) * gridSize;
  let gridAlignedSpacing = Math.max(gridSize, roundedSpacing);

  // Distribute symmetrically around the node center.
  let totalSpan = (numHandles - 1) * gridAlignedSpacing;
  let startPosition = (nodeSize - totalSpan) / 2;

  // Since nodeSize is a grid multiple, startPosition is either on-grid or
  // exactly half a grid step off. Bump spacing down one grid step to fix parity.
  if (startPosition % gridSize !== 0 && gridAlignedSpacing > gridSize) {
    gridAlignedSpacing -= gridSize;
    totalSpan = (numHandles - 1) * gridAlignedSpacing;
    startPosition = (nodeSize - totalSpan) / 2;
  }

  const positions: number[] = [];
  for (let i = 0; i < numHandles; i++) {
    positions.push(startPosition + i * gridAlignedSpacing);
  }

  return positions;
};
