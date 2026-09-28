import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import RouteIcon from '@mui/icons-material/Route';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type React from 'react';

import type { ModelTag } from './types';

/**
 * Each tag kind maps to one of Apollo's semantic mini-chip variants
 * (`success | warning | info | error | neutral`) — the compact
 * 16px-tall semibold pill from Apollo's tag pattern. The styles are
 * baked into the chip below (see `MINI_COLORS`), so no MUI theme is
 * required; the variant name doubles as a className for hosts that
 * target it. Kinds without a clean semantic mapping fall back to the
 * default mini chip (gray, neutral).
 *
 * Mapping rationale:
 *   recommended  → success (positive, evaluation-backed)
 *   preview      → info    (informational, new)
 *   deprecating  → warning (caution before removal)
 *   out-of-region → error  (compliance risk)
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
 * Self-contained styling for the mini-chip variants, mirroring Apollo's
 * `MuiChip` theme overrides. Baked in via `sx` so the chip renders
 * correctly without a ThemeProvider (bare web-component hosts, Vite
 * Storybook) — same CSS-variable contract as the rest of the picker,
 * with Apollo light-theme values as fallbacks.
 */
const MINI_COLORS: Record<string, { color: string; backgroundColor: string }> = {
  mini: {
    color: 'var(--color-foreground, #273139)',
    backgroundColor: 'var(--color-background-secondary, #f4f5f7)',
  },
  'info-mini': {
    color: 'var(--color-info-foreground, #1665b3)',
    backgroundColor: 'var(--color-info-background, #e9f1fa)',
  },
  'success-mini': {
    color: 'var(--color-success-text, #038108)',
    backgroundColor: 'var(--color-success-background, #eeffe5)',
  },
  'warning-mini': {
    color: 'var(--color-warning-text, #9e6100)',
    backgroundColor: 'var(--color-warning-background, #fff3db)',
  },
  'error-mini': {
    color: 'var(--color-error-text, #a6040a)',
    backgroundColor: 'var(--color-error-background, #fff0f1)',
  },
};

// Icon glyphs for built-in tag kinds. Picked from `@mui/icons-material`
// because that's already used elsewhere in apollo-react (no new dep);
// the design handoff's stroke-style glyphs (✓, ⚠, 🌐, ⤴) are best
// approximated by these outlined variants.
//
// We deliberately use *outlined* variants for the lifecycle / warning
// kinds — filled icons feel heavier and compete with the model name
// next to them. The check inside `Recommended` is the one exception:
// `CheckCircleOutline` matches the design's solid check glyph.
const ICON_MAP: Record<string, React.ComponentType<{ fontSize?: 'inherit' }>> = {
  recommended: CheckCircleOutlineIcon,
  preview: ScienceOutlinedIcon,
  deprecating: WarningAmberOutlinedIcon,
  substituted: RouteIcon,
  'out-of-region': PublicOffIcon,
  // `custom` and the cost-tier kinds stay icon-less — they're already
  // tagged by color/shape and the label does the work. Adding glyphs
  // there crowded the right column.
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
   * are tag kinds; values are React components rendered as the leading
   * icon (sized 14px). Pass `null` for a kind to suppress the icon on
   * built-in kinds. Tags without an entry render without an icon.
   */
  icons?: Record<string, React.ComponentType<{ fontSize?: 'inherit' }> | null>;
}

export const ModelTagChip: React.FC<ModelTagChipProps> = ({ tag, variants, icons }) => {
  // Resolution order: inline override on the tag → host-supplied
  // variants map → built-in map → neutral fallback. Inline first so a
  // single tag can opt out of the default without disturbing other
  // tags of the same kind.
  const variantClass = tag.variant ?? variants?.[tag.kind] ?? VARIANT_MAP[tag.kind] ?? 'mini';

  // Same precedence for icons: host map > built-in map. Host can pass
  // `null` to suppress an icon on a built-in kind (e.g. for a compact
  // surface).
  const Icon = icons && tag.kind in icons ? icons[tag.kind] : ICON_MAP[tag.kind];

  // Unknown variant strings (product-invented kinds without a matching
  // entry) get the neutral gray mini treatment, same as the theme did.
  const colors = MINI_COLORS[variantClass] ?? MINI_COLORS['mini'];

  const chip = (
    <Chip
      size="small"
      label={tag.label}
      className={variantClass}
      icon={
        Icon ? (
          <Icon
            // 12-13px reads as a glyph next to a 11px label without
            // pushing the chip's own min-height up.
            fontSize="inherit"
          />
        ) : undefined
      }
      sx={{
        // Mini-chip metrics from Apollo's MuiChip overrides (16px pill,
        // FontXs 10/16 semibold, horizontal padding carried by the label).
        height: '16px',
        paddingLeft: 0,
        paddingRight: 0,
        fontSize: '10px',
        lineHeight: '16px',
        fontWeight: 600,
        ...colors,
        '& .MuiChip-label': { px: 0.75 },
        // The leading icon needs a touch of breathing room from the
        // label without inheriting the variant's text color directly
        // (the icon should be the *same* color so the chip reads as
        // one painted pill).
        '& .MuiChip-icon': {
          fontSize: 13,
          marginLeft: 0.5,
          marginRight: -0.25,
          color: 'inherit',
        },
      }}
    />
  );

  if (tag.tooltip) {
    return (
      <Tooltip title={tag.tooltip} arrow placement="top">
        <span>{chip}</span>
      </Tooltip>
    );
  }
  return chip;
};
