'use client';

import { CircleCheck, FlaskConical, GlobeLock, Route, TriangleAlert } from 'lucide-react';
import type * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import type { ModelTag } from './types';

/**
 * Each tag kind maps to one of the picker's semantic mini-chip variants
 * (`success | warning | info | error | neutral`). The variant tokens are
 * the same strings the apollo-react picker uses, so the two components
 * share a prop surface; `BADGE_VARIANT` below is the only place they
 * diverge, translating a token onto a wind `Badge` variant.
 *
 * Mapping rationale:
 *   recommended   → success (positive, evaluation-backed)
 *   preview       → info    (informational, new)
 *   deprecating   → warning (caution before removal)
 *   out-of-region → error   (compliance risk)
 *   custom / thinking → neutral mini
 *
 * Cost tiers render as neutral gray mini chips intentionally — using the
 * semantic warning/error palette there would imply that high-cost
 * models are *risky*, which they aren't.
 */
const VARIANT_MAP: Record<string, string> = {
  recommended: 'success-mini',
  preview: 'info-mini',
  deprecating: 'warning-mini',
  // Substitution is the post-retirement state of `deprecating` — the user's
  // stored selection now points at a model whose traffic is being routed
  // elsewhere. Same warning semantic so retirement-related signals share
  // a visual language as they progress (scheduled → in effect).
  substituted: 'warning-mini',
  'out-of-region': 'error-mini',
  custom: 'mini',
  thinking: 'info-mini',
  'cost-basic': 'mini',
  'cost-standard': 'mini',
  'cost-premium': 'mini',
};

/**
 * Mini-chip token → wind `Badge` variant. Unknown tokens (a product
 * inventing a kind without registering a variant) fall through to the
 * neutral gray treatment.
 */
const BADGE_VARIANT: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  mini: 'secondary',
  'info-mini': 'info',
  'success-mini': 'success',
  'warning-mini': 'warning',
  'error-mini': 'error',
};

/**
 * Icon glyphs for built-in tag kinds, from `lucide-react` (already an
 * apollo-wind dependency). Outlined/stroke glyphs throughout — filled
 * icons feel heavier and compete with the model name next to them.
 *
 * `custom` and the cost-tier kinds stay icon-less: they're already
 * tagged by color and label, and glyphs there crowd the right column.
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  recommended: CircleCheck,
  preview: FlaskConical,
  deprecating: TriangleAlert,
  substituted: Route,
  'out-of-region': GlobeLock,
};

export interface ModelTagChipProps {
  tag: ModelTag;
  /**
   * Optional product-supplied lookup for tag kinds the design system
   * doesn't know about. Wins over the built-in map for matching keys.
   * Use when `customTagsFor` introduces a new kind (e.g.
   * `{ multimodal: 'info-mini', onprem: 'warning-mini' }`).
   */
  variants?: Record<string, string>;
  /**
   * Optional product-supplied icon lookup for custom tag kinds. Keys
   * are tag kinds; values are components rendered as the leading icon.
   * Pass `null` for a kind to suppress the icon on a built-in kind.
   * Tags without an entry render without an icon.
   */
  icons?: Record<string, React.ComponentType<{ className?: string }> | null>;
  /**
   * Render the chip without its tooltip. The tooltip trigger is a button, so
   * a chip shown inside another button — the picker's trigger — would nest
   * one button in another, which is invalid HTML and breaks hit-testing. The
   * row chips carry the same tooltips, so nothing is lost.
   */
  disableTooltip?: boolean;
}

export const ModelTagChip: React.FC<ModelTagChipProps> = ({
  tag,
  variants,
  icons,
  disableTooltip,
}) => {
  // Resolution order: inline override on the tag → host-supplied
  // variants map → built-in map → neutral fallback. Inline first so a
  // single tag can opt out of the default without disturbing other
  // tags of the same kind.
  const variantToken = tag.variant ?? variants?.[tag.kind] ?? VARIANT_MAP[tag.kind] ?? 'mini';

  // Same precedence for icons: host map > built-in map. Host can pass
  // `null` to suppress an icon on a built-in kind (e.g. for a compact
  // surface).
  const Icon = icons && tag.kind in icons ? icons[tag.kind] : ICON_MAP[tag.kind];

  const chip = (
    <Badge
      // The token doubles as a className so hosts can still target a
      // specific kind, matching the apollo-react picker's contract.
      className={cn(
        'h-4 gap-0.5 px-1.5 py-0 text-[10px] leading-4 font-semibold',
        // The neutral pill's fill is `--secondary`, which resolves to
        // `--surface-overlay` — the same value a host may paint the field
        // with, and then the chip disappears into its own ground. An edge
        // keeps it a pill on any surface. The semantic variants carry their
        // own contrast and stay borderless.
        variantToken === 'mini' ? 'border-border' : 'border-transparent',
        variantToken
      )}
      data-slot="model-picker-tag"
      data-tag-kind={tag.kind}
      variant={BADGE_VARIANT[variantToken] ?? 'secondary'}
    >
      {Icon ? <Icon className="size-3 shrink-0" /> : null}
      {tag.label}
    </Badge>
  );

  if (tag.tooltip && !disableTooltip) {
    return (
      // Own provider so the chip works standalone — it is exported for
      // teams composing their own pickers, and Radix nests providers
      // harmlessly when the host already mounts one.
      <TooltipProvider>
        <Tooltip>
          {/* `asChild` would make Badge the trigger, but a disabled-looking
            inline chip needs a focusable wrapper for keyboard tooltips. */}
          {/* No `asChild`: the trigger renders its own button, so the
              chip is reachable by keyboard without a tabindex hack. */}
          <TooltipTrigger className="inline-flex max-w-full">{chip}</TooltipTrigger>
          <TooltipContent side="top">{tag.tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return chip;
};
