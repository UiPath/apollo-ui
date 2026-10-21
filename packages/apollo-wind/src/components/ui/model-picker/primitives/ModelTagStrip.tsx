'use client';

import type * as React from 'react';
import { useVisibleCount } from '@/components/ui/use-visible-count';
import { cn } from '@/lib';
import type { ModelPickerLabels } from '../labels';
import { ModelTagChip, tagVariantToken } from '../ModelTagChip';
import type { ModelTag } from '../types';

// Must match the chips' `gap-1.5` and the count's `ml-1.5`.
const CHIP_GAP = 6;

const SEVERITY_RANK: Record<string, number> = { 'error-mini': 0, 'warning-mini': 1 };
const OTHER_RANK = 2;

const tagKey = (t: ModelTag) => `${t.kind}-${t.label}`;

export interface ModelTagStripProps {
  tags: readonly ModelTag[];
  labels: ModelPickerLabels;
  tagVariants?: Record<string, string>;
  disableTooltip?: boolean;
}

export const ModelTagStrip: React.FC<ModelTagStripProps> = ({
  tags,
  labels,
  tagVariants,
  disableTooltip,
}) => {
  // Warnings first, so the chip a narrow strip keeps is the one that needs attention.
  const rank = (t: ModelTag) => SEVERITY_RANK[tagVariantToken(t, tagVariants)] ?? OTHER_RANK;
  const ordered = [...tags].sort((a, b) => rank(a) - rank(b));
  // No chip has to stay: the name beside the strip already says which model it is.
  const { containerRef, itemRefs, overflowRef, visibleCount } = useVisibleCount(
    ordered.length > 0,
    ordered.map(tagKey),
    CHIP_GAP,
    0
  );
  if (ordered.length === 0) return null;

  const hiddenCount = ordered.length - visibleCount;
  const hiddenLabels = ordered.slice(visibleCount).map((t) => t.label);

  return (
    // Zero basis and no `min-w-0`: only the width the name leaves, but never less than the count.
    <span
      className="relative grid flex-1 basis-0 grid-cols-[minmax(0,max-content)_auto] items-center justify-start"
      data-slot="model-picker-tags"
      ref={containerRef as React.Ref<HTMLSpanElement>}
    >
      <span className="relative flex min-w-0 items-center gap-1.5 overflow-hidden">
        {ordered.map((t, i) => (
          // `flex items-center`: a block wrapper would lift the chip off the name's centre.
          // Parked, not unmounted, so it stays measurable; `opacity-0`, not `invisible`, so it is announced.
          <span
            className={cn(
              'flex shrink-0 items-center whitespace-nowrap',
              i >= visibleCount && 'pointer-events-none absolute opacity-0'
            )}
            key={tagKey(t)}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
          >
            <ModelTagChip disableTooltip={disableTooltip} tag={t} variants={tagVariants} />
          </span>
        ))}
      </span>
      {/* Every count in one cell, so its width never changes; a margin, not a gap, so an empty column takes no room. */}
      <span
        aria-hidden
        className={cn('ml-1.5 grid whitespace-nowrap', hiddenCount === 0 && 'absolute opacity-0')}
        data-overflow=""
        ref={overflowRef as React.Ref<HTMLSpanElement>}
      >
        {ordered.map((t, i) => (
          <span
            className={cn(
              'col-start-1 row-start-1 flex items-center',
              i + 1 !== hiddenCount && 'invisible'
            )}
            key={tagKey(t)}
          >
            <ModelTagChip
              disableTooltip={disableTooltip}
              tag={{
                kind: 'overflow',
                label: labels.hiddenTagCount(i + 1),
                tooltip:
                  i + 1 === hiddenCount ? labels.hiddenTagCountTooltip(hiddenLabels) : undefined,
                variant: 'mini',
              }}
            />
          </span>
        ))}
      </span>
    </span>
  );
};
