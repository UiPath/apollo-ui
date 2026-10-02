import { describe, expect, it } from 'vitest';
import { EDGE_COLORS } from './constants';
import { resolveEdgeColor } from './resolveEdgeColor';

const STATUS = 'var(--canvas-info-icon)';

/**
 * Locks the color priority the legacy SequenceEdge implemented inline:
 * diff > invalid > preview/selected > hover > status > default.
 */
describe('resolveEdgeColor', () => {
  it('returns the default border color with no state', () => {
    expect(resolveEdgeColor({})).toBe(EDGE_COLORS.default);
  });

  it('diffAdded wins over everything', () => {
    expect(
      resolveEdgeColor({
        isDiffAdded: true,
        isDiffRemoved: true,
        isInvalid: true,
        previewEdge: true,
        selected: true,
        isHovered: true,
        statusColor: STATUS,
      })
    ).toBe(EDGE_COLORS.diffAdded);
  });

  it('diffRemoved wins over invalid/selection/hover/status', () => {
    expect(
      resolveEdgeColor({
        isDiffRemoved: true,
        isInvalid: true,
        previewEdge: true,
        selected: true,
        isHovered: true,
        statusColor: STATUS,
      })
    ).toBe(EDGE_COLORS.diffRemoved);
  });

  it('invalid wins over selection/hover/status', () => {
    expect(
      resolveEdgeColor({ isInvalid: true, selected: true, isHovered: true, statusColor: STATUS })
    ).toBe(EDGE_COLORS.invalid);
  });

  it('preview and selected resolve to the primary color over hover and status', () => {
    expect(resolveEdgeColor({ previewEdge: true, isHovered: true, statusColor: STATUS })).toBe(
      EDGE_COLORS.selected
    );
    expect(resolveEdgeColor({ selected: true, isHovered: true, statusColor: STATUS })).toBe(
      EDGE_COLORS.selected
    );
  });

  it('hover wins over status', () => {
    expect(resolveEdgeColor({ isHovered: true, statusColor: STATUS })).toBe(EDGE_COLORS.hover);
  });

  it('status color applies when nothing overrides it', () => {
    expect(resolveEdgeColor({ statusColor: STATUS })).toBe(STATUS);
  });
});

describe('resolveEdgeColor suggestionType', () => {
  it('resolves add to the diffAdded color', () => {
    expect(resolveEdgeColor({ suggestionType: 'add' })).toBe(EDGE_COLORS.diffAdded);
  });

  it('resolves update to the diffUpdated color', () => {
    expect(resolveEdgeColor({ suggestionType: 'update' })).toBe(EDGE_COLORS.diffUpdated);
  });

  it('resolves delete to the diffRemoved color', () => {
    expect(resolveEdgeColor({ suggestionType: 'delete' })).toBe(EDGE_COLORS.diffRemoved);
  });

  it('takes precedence over the legacy isDiffAdded/isDiffRemoved flags', () => {
    expect(
      resolveEdgeColor({
        suggestionType: 'update',
        isDiffAdded: true,
        isDiffRemoved: true,
      })
    ).toBe(EDGE_COLORS.diffUpdated);
    expect(resolveEdgeColor({ suggestionType: 'add', isDiffRemoved: true })).toBe(
      EDGE_COLORS.diffAdded
    );
    expect(resolveEdgeColor({ suggestionType: 'delete', isDiffAdded: true })).toBe(
      EDGE_COLORS.diffRemoved
    );
  });

  it('takes precedence over invalid/selection/hover/status', () => {
    expect(
      resolveEdgeColor({
        suggestionType: 'update',
        isInvalid: true,
        selected: true,
        isHovered: true,
        statusColor: STATUS,
      })
    ).toBe(EDGE_COLORS.diffUpdated);
  });

  it('falls back to the legacy flags when suggestionType is absent', () => {
    expect(resolveEdgeColor({ isDiffAdded: true })).toBe(EDGE_COLORS.diffAdded);
    expect(resolveEdgeColor({ isDiffRemoved: true })).toBe(EDGE_COLORS.diffRemoved);
  });
});
