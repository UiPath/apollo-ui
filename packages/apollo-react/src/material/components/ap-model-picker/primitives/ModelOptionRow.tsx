import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Colors, FontFamily } from '@uipath/apollo-core';
import React from 'react';
import type { PickerTranslator } from '../i18n';

import { ModelTagChip } from '../ModelTagChip';
import type { DiscoveryModel } from '../types';
import { type DeriveModelTagsContext, deriveModelTags } from '../utils';

export interface ModelOptionRowProps {
  model: DiscoveryModel;
  /**
   * Position of this row in the flat option list. Passed back through
   * `onActivate` so the row's handlers stay referentially stable — the
   * key to `React.memo` skipping re-renders of untouched rows.
   */
  index: number;
  active: boolean;
  selected: boolean;
  /**
   * Called with the row's model on click. Pass a stable reference
   * (e.g. the `choose` callback from `useModelPickerState`) so
   * memoization holds.
   */
  onSelect: (model: DiscoveryModel) => void;
  /**
   * Called with the row's index on pointer-enter (drives the keyboard
   * active-row highlight). Pass a stable reference.
   */
  onActivate?: (index: number) => void;
  /**
   * Context forwarded to `deriveModelTags`. Carries `homeRegion`,
   * `recommendedModelIds` / `previewModelIds` (Model_hub overrides),
   * `costTierFor`, `customTagsFor`, and the Lingui `i18n` instance.
   */
  tagContext?: DeriveModelTagsContext;
  /**
   * Apollo MUI chip variant lookup for tag kinds the design system
   * doesn't know about. Forwarded straight to `<ModelTagChip>`. Built-in
   * kinds keep their default variant unless explicitly overridden here.
   */
  tagVariants?: Record<string, string>;
  /**
   * Right-aligned actions renderer, called with the row's model.
   * Return `null` to suppress actions for a given row. When omitted,
   * no actions render (the standalone `defaultRowActions` needs an
   * `onEdit` handler the row cannot invent).
   */
  renderActions?: (model: DiscoveryModel) => React.ReactNode;
  /**
   * Extra meta renderer (below the tier chip + context line in the
   * right column). Use for cost bars, latency badges, etc.
   */
  renderMeta?: (model: DiscoveryModel) => React.ReactNode;
  /**
   * Reduces row height + font sizes for tight surfaces (chat input
   * footers, narrow side panels). The stock picker doesn't use this;
   * kept for teams composing their own pickers from primitives.
   */
  dense?: boolean;
  /**
   * Tag kinds to hide from chip rendering. Tags are still derived; this
   * only affects display.
   */
  hideTagKinds?: readonly string[];
  /**
   * Stable DOM id assigned to the row. Used by the search input's
   * `aria-activedescendant` so screen readers announce the highlighted
   * row while keyboard focus stays on the input.
   */
  id?: string;
  /** Optional test id forwarded to the row. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'data-testid'?: string;
}

const FULL_OPTION_HEIGHT = 64;
const DENSE_OPTION_HEIGHT = 44;

function formatContextWindow(tokens: number | undefined): string | null {
  if (tokens == null || tokens <= 0) return null;
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M context`;
  }
  if (tokens >= 1_000) {
    const k = Math.round(tokens / 1_000);
    return `${k}K context`;
  }
  return `${tokens} context`;
}

/**
 * One row in the picker dropdown. Exported so teams can render their own
 * grouped/ungrouped lists while keeping the styling consistent with the
 * stock `<ModelPicker>`.
 *
 * Memoized: with stable `onSelect` / `onActivate` / renderer props, only
 * the rows whose `active` / `selected` flags actually changed re-render
 * when the user moves the highlight — the difference between smooth and
 * janky on 200+ model catalogs.
 */
const ModelOptionRowInner: React.FC<ModelOptionRowProps> = ({
  model,
  index,
  active,
  selected,
  onSelect,
  onActivate,
  tagContext,
  tagVariants,
  renderActions,
  renderMeta,
  dense,
  hideTagKinds,
  id,
  'data-testid': dataTestId,
}) => {
  const inlineTags = deriveModelTags(model, tagContext ?? {}).filter(
    (t) => !hideTagKinds?.includes(t.kind)
  );

  // Friendly-mode rows show the human label up top and the technical id
  // as a monospace secondary line. Display names come from the
  // Discovery DTO only (authored centrally, merged server-side) —
  // products cannot rename models. When the DTO carries no name, the
  // technical name *is* the primary label and the secondary line only
  // renders for BYO models (where the connection name is the only
  // disambiguator between two models with the same technical id).
  const primaryLabel = model.displayName ?? null;
  const primary = primaryLabel ?? model.modelName;
  const usesFriendlyName = !!primaryLabel && primaryLabel !== model.modelId;
  const techId = usesFriendlyName ? model.modelId : null;
  const minHeight = dense ? DENSE_OPTION_HEIGHT : FULL_OPTION_HEIGHT;
  const contextLabel = formatContextWindow(model.modelDetails?.contextWindowTokens);
  const rowActions = renderActions ? renderActions(model) : null;
  const meta = renderMeta?.(model);

  return (
    <ButtonBase
      component="div"
      id={id}
      role="option"
      aria-selected={selected}
      data-testid={dataTestId}
      tabIndex={-1}
      onClick={() => onSelect(model)}
      onMouseEnter={onActivate ? () => onActivate(index) : undefined}
      sx={{
        width: '100%',
        minHeight,
        // 14px horizontal per the design handoff's row spec.
        px: dense ? 1.5 : 1.75,
        py: dense ? 0.875 : 1.375,
        display: 'flex',
        alignItems: 'flex-start',
        gap: dense ? 1 : 1.5,
        justifyContent: 'flex-start',
        textAlign: 'left',
        position: 'relative',
        // Selected state: 3px left accent bar (primary) plus a
        // `colorBackgroundSelected` fill across the whole row. Both
        // colors read through CSS variables so the row dark-modes
        // correctly when used as a web component.
        boxShadow: selected
          ? `inset 3px 0px 0px var(--color-primary, ${Colors.ColorBlue500})`
          : 'none',
        backgroundColor: selected
          ? `var(--color-background-selected, ${Colors.ColorBlue050})`
          : active
            ? `var(--color-background-hover, rgba(82, 96, 105, 0.078))`
            : 'transparent',
        '&:hover': {
          backgroundColor: selected
            ? `var(--color-background-selected, ${Colors.ColorBlue050})`
            : `var(--color-background-hover, rgba(82, 96, 105, 0.078))`,
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            // Don't wrap chips onto a second line — when the model name is
            // long we'd rather truncate the name and keep the row single-line.
            // Chips are right-pinned via `flex-shrink: 0` on the chip itself.
            flexWrap: 'nowrap',
            minWidth: 0,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: `var(--color-foreground, ${Colors.ColorGray850})`,
              lineHeight: 1.3,
              fontSize: dense ? 13 : 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              // Pack the title left so chips sit *next to* the name,
              // not at the far right of the left column. `flex-shrink: 1`
              // lets the title ellipsis when the row is crowded.
              flex: '0 1 auto',
              minWidth: 0,
            }}
          >
            {primary}
          </Typography>
          {inlineTags.map((t) => (
            <Box key={`${t.kind}-${t.label}`} sx={{ flexShrink: 0 }}>
              <ModelTagChip tag={t} variants={tagVariants} />
            </Box>
          ))}
        </Box>
        {techId && (
          // Friendly-mode secondary line: the canonical technical id in
          // monospace so users can still copy/audit the actual model
          // string the gateway will call.
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
              mt: 0.25,
              fontFamily: FontFamily.FontMono,
              fontSize: 11,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {techId}
          </Typography>
        )}
        {/*
          BYO rows surface the connection name regardless of friendly
          mode — two BYO models can share a technical id (`gpt-4o` from
          two different connections) and the connection label is the
          only disambiguator.
        */}
        {model.byoConnectionLabel && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
              mt: techId ? 0 : 0.25,
              fontSize: 12,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {model.byoConnectionLabel}
          </Typography>
        )}
      </Box>
      {(contextLabel ?? meta) && (
        // Right column: the context window line with any host-supplied
        // meta stacked underneath. Aligns to the end (per design) and
        // never shrinks — name truncates first.
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 0.5,
            pt: 0.125,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextLabel && (
            <Typography
              variant="caption"
              sx={{
                color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
                fontSize: 11,
                lineHeight: 1.2,
              }}
            >
              {contextLabel}
            </Typography>
          )}
          {meta}
        </Box>
      )}
      {rowActions && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            flexShrink: 0,
            pt: 0.125,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {rowActions}
        </Box>
      )}
    </ButtonBase>
  );
};

export const ModelOptionRow = React.memo(ModelOptionRowInner);
ModelOptionRow.displayName = 'ModelOptionRow';

/**
 * Default row-actions renderer: an edit icon button for BYO models,
 * wired by the picker to the AI Trust Layer LLM-configurations page
 * (removal lives on that page, so there is no separate delete action).
 * Exported so consumers can fall back to it when overriding row
 * actions selectively (e.g. add a "Set default" action without losing
 * edit).
 *
 * Renders nothing without an `onEdit` handler — an action button that
 * does nothing is worse than no button. Admin-gated by default: the
 * picker only calls this when `canManageByo` is true. Standalone
 * consumers should gate the call themselves before passing the result
 * into `renderActions`.
 */
export function defaultRowActions(
  model: DiscoveryModel,
  options: {
    /**
     * Lingui i18n instance. When provided, tooltips localize; when
     * omitted, English source strings are used.
     */
    i18n?: PickerTranslator;
    /** Edit activation — the picker navigates to the configuration page. */
    onEdit?: (model: DiscoveryModel) => void;
  } = {}
): React.ReactNode {
  const { i18n, onEdit } = options;
  if (!onEdit) return null;
  const isByo =
    model.modelSubscriptionType === 'BYOMAdded' ||
    model.modelSubscriptionType === 'BYOMReplacedAlternative' ||
    model.modelSubscriptionType === 'BYOMReplacedLikeForLike';
  if (!isByo) return null;
  const editTitle = i18n
    ? i18n._({
        id: 'modelPicker.row.editConfiguration',
        message: 'Edit configuration',
      })
    : 'Edit configuration';
  return (
    <Tooltip title={editTitle} arrow>
      <IconButton
        size="small"
        sx={{ color: 'inherit' }}
        aria-label={editTitle}
        onClick={() => onEdit(model)}
      >
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

export { FULL_OPTION_HEIGHT, DENSE_OPTION_HEIGHT };
