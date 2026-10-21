import Box from '@mui/material/Box';
import type React from 'react';
import { useSafeLingui } from '../../../../i18n';

import { ModelTagChip, tagVariantToken } from '../ModelTagChip';
import type { ModelTag } from '../types';
import { useVisibleCount } from '../useVisibleCount';

// Must match the chips' `gap: 0.75` and the count's `ml: 0.75` (6px).
const CHIP_GAP = 6;

const SEVERITY_RANK: Record<string, number> = { 'error-mini': 0, 'warning-mini': 1 };
const OTHER_RANK = 2;

// Out of flow so it takes no room, transparent rather than hidden so it is still announced.
const PARKED = { position: 'absolute', opacity: 0, pointerEvents: 'none' } as const;

const tagKey = (t: ModelTag) => `${t.kind}-${t.label}`;

export interface ModelTagStripProps {
  tags: readonly ModelTag[];
  tagVariants?: Record<string, string>;
}

export const ModelTagStrip: React.FC<ModelTagStripProps> = ({ tags, tagVariants }) => {
  const { _ } = useSafeLingui();
  // Warnings first, so the chip a narrow strip keeps is the one that needs attention.
  const rank = (t: ModelTag) => SEVERITY_RANK[tagVariantToken(t, tagVariants)] ?? OTHER_RANK;
  const ordered = [...tags].sort((a, b) => rank(a) - rank(b));
  const { containerRef, itemRefs, overflowRef, visibleCount } = useVisibleCount(
    ordered.length > 0,
    ordered.map(tagKey),
    CHIP_GAP
  );
  if (ordered.length === 0) return null;

  const hiddenCount = ordered.length - visibleCount;
  const hiddenLabels = ordered.slice(visibleCount).map((t) => t.label);

  return (
    // Zero basis and no `minWidth: 0`: only the width the name leaves, but never less than the count.
    <Box
      component="span"
      data-slot="model-picker-tags"
      ref={containerRef}
      sx={{
        position: 'relative',
        flex: '1 1 0',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, max-content) auto',
        alignItems: 'center',
        justifyContent: 'start',
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {ordered.map((t, i) => (
          <Box
            component="span"
            key={tagKey(t)}
            ref={(el: HTMLElement | null) => {
              itemRefs.current[i] = el;
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              ...(i >= visibleCount ? PARKED : {}),
            }}
          >
            <ModelTagChip tag={t} variants={tagVariants} />
          </Box>
        ))}
      </Box>
      {/* Every count in one cell, so its width never changes; a margin, not a gap, so an empty column takes no room. */}
      <Box
        component="span"
        aria-hidden
        data-overflow=""
        ref={overflowRef}
        sx={{
          ml: 0.75,
          display: 'grid',
          whiteSpace: 'nowrap',
          ...(hiddenCount === 0 ? PARKED : {}),
        }}
      >
        {ordered.map((t, i) => (
          <Box
            component="span"
            key={tagKey(t)}
            sx={{
              gridColumn: 1,
              gridRow: 1,
              display: 'flex',
              alignItems: 'center',
              visibility: i + 1 === hiddenCount ? 'visible' : 'hidden',
            }}
          >
            <ModelTagChip
              tag={{
                kind: 'overflow',
                label: _({
                  id: 'modelPicker.tag.hiddenCount.label',
                  message: '+{count}',
                  values: { count: i + 1 },
                }),
                tooltip: i + 1 === hiddenCount ? hiddenLabels.join(', ') : undefined,
                variant: 'mini',
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
