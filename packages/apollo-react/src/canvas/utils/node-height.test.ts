import { describe, expect, it } from 'vitest';
import type { HandleGroupManifest } from '../schema/node-definition';
import { resolveHandles } from './manifest-resolver';
import { computeBaseNodeHeight, getIntrinsicNodeHeight } from './node-height';

const handles = (position: string, count: number): HandleGroupManifest =>
  ({
    position,
    handles: Array.from({ length: count }, (_, i) => ({
      id: `h${i}`,
      type: 'target',
      handleType: 'input',
    })),
  }) as HandleGroupManifest;

describe('computeBaseNodeHeight', () => {
  it('returns the 96px default when handles fit within it', () => {
    expect(computeBaseNodeHeight([handles('left', 2)])).toBe(96);
    expect(computeBaseNodeHeight([])).toBe(96);
  });

  it('expands with the densest left/right rail', () => {
    // 4 handles → (4*2+2)*16 = 160
    expect(computeBaseNodeHeight([handles('left', 4)])).toBe(160);
    expect(computeBaseNodeHeight([handles('left', 2), handles('right', 4)])).toBe(160);
    // Top/bottom rails never contribute to the floor.
    expect(computeBaseNodeHeight([handles('top', 8)])).toBe(96);
  });

  it('uses the fixed footer height as the floor when it exceeds the handle floor', () => {
    expect(
      computeBaseNodeHeight([handles('left', 2)], { hasFooter: true, footerVariant: 'single' })
    ).toBe(160);
    expect(getIntrinsicNodeHeight(true, 'double')).toBe(176);
    expect(getIntrinsicNodeHeight(false, undefined)).toBe(96);
  });

  it('skips groups and handles hidden by boolean visibility', () => {
    const hiddenGroup = { ...handles('left', 4), visible: false };
    expect(computeBaseNodeHeight([hiddenGroup])).toBe(96);

    const partiallyHidden = {
      position: 'left',
      handles: [
        { id: 'a', type: 'target', handleType: 'input' },
        { id: 'b', type: 'target', handleType: 'input', visible: false },
      ],
    } as HandleGroupManifest;
    expect(computeBaseNodeHeight([partiallyHidden, handles('right', 4)])).toBe(160);
  });

  // The seeding contract: a raw manifest counted WITH resolutionContext must
  // agree exactly with counting the resolveHandles output, because BaseNode
  // computes from the resolved set. A drifting seed would re-introduce the
  // mount height write the seeding API exists to eliminate.
  describe('resolutionContext parity with BaseNode', () => {
    const dynamicManifest: HandleGroupManifest[] = [
      {
        position: 'right',
        handles: [
          {
            id: 'case-{index}',
            type: 'source',
            handleType: 'output',
            repeat: 'cases',
          },
          { id: 'error', type: 'source', handleType: 'output', visible: 'hasErrorBranch' },
        ],
      },
    ] as HandleGroupManifest[];

    const data = {
      cases: [{}, {}, {}, {}],
      hasErrorBranch: false,
    };

    it('expands repeat handles and evaluates string visibility', () => {
      // 4 repeat-expanded + error hidden → 4 right handles → 160px.
      expect(computeBaseNodeHeight(dynamicManifest, { resolutionContext: data })).toBe(160);
      // Raw counting (no context) would see 2 configured handles → 96px floor,
      // which is exactly the drift the option exists to prevent.
      expect(computeBaseNodeHeight(dynamicManifest)).toBe(96);
    });

    it('matches counting the resolveHandles output exactly', () => {
      const resolved = resolveHandles(dynamicManifest, data);
      expect(computeBaseNodeHeight(dynamicManifest, { resolutionContext: data })).toBe(
        computeBaseNodeHeight(resolved)
      );
    });
  });
});
