import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Colors } from '@uipath/apollo-core';
import type React from 'react';
import { useSafeLingui } from '../../../../i18n';

import { ModelTagChip } from '../ModelTagChip';
import type { DiscoveryModel } from '../types';
import { type DeriveModelTagsContext, deriveModelTags } from '../utils';

export interface PickerTriggerProps {
  id: string;
  selected: DiscoveryModel | null;
  /**
   * Raw stored value that didn't resolve against `models`. When set,
   * the trigger renders the id verbatim in error-red with the trigger
   * border switched to error red — so a stale config doesn't look
   * identical to "nothing selected". `null` for the normal case.
   */
  unknownValue?: string | null;
  placeholder?: string;
  disabled?: boolean;
  open: boolean;
  invalid?: boolean;
  /**
   * Context forwarded to `deriveModelTags` for the selected model's
   * chips. Carries the Lingui `i18n` instance, `homeRegion`,
   * test overrides, and `customTagsFor`.
   */
  tagContext?: DeriveModelTagsContext;
  /**
   * Apollo MUI chip variant lookup for tag kinds the design system
   * doesn't know about. Forwarded straight to `<ModelTagChip>`.
   */
  tagVariants?: Record<string, string>;
  /**
   * When set, replaces `selected.modelName` as the trigger's primary
   * label. Mirrors the row's friendly-mode behavior so trigger + rows
   * stay in sync.
   */
  primaryLabel?: string | null;
  /** Extra content rendered to the right of the model name, before the caret. */
  extra?: React.ReactNode;
  onClick: () => void;
  triggerRef?: React.Ref<HTMLButtonElement>;
  /**
   * Tag kinds to hide from the trigger's selected-model chips. Used by
   * the compact picker to keep the trigger uncluttered.
   */
  hideTagKinds?: readonly string[];
  /**
   * ID of the popup's listbox. Used to set `aria-controls` so screen
   * readers know which element the trigger opens.
   */
  controlsId?: string;
  /**
   * ID of an external error message to associate with the trigger.
   * Forwarded as `aria-describedby` so screen readers announce the
   * error alongside the field.
   */
  describedById?: string;
  /** Mark the field as required. Forwarded as `aria-required`. */
  required?: boolean;
  /** Optional className forwarded to the trigger element. */
  className?: string;
  /** Test id forwarded to the trigger element. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'data-testid'?: string;
}

export const PickerTrigger: React.FC<PickerTriggerProps> = ({
  id,
  selected,
  unknownValue,
  placeholder = 'Select a model',
  disabled,
  open,
  invalid,
  tagContext,
  tagVariants,
  primaryLabel,
  extra,
  onClick,
  triggerRef,
  hideTagKinds,
  controlsId,
  describedById,
  required,
  className,
  'data-testid': dataTestId,
}) => {
  const { _ } = useSafeLingui();
  const effectiveCtx: DeriveModelTagsContext = tagContext ?? { i18n: { _ } };
  const inlineTags = selected
    ? deriveModelTags(selected, effectiveCtx).filter((t) => !hideTagKinds?.includes(t.kind))
    : [];
  const primary = selected ? (primaryLabel ?? selected.modelName) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <ButtonBase
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={className}
        data-testid={dataTestId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open && controlsId ? controlsId : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={describedById}
        focusRipple
        sx={{
          width: '100%',
          minHeight: 44,
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          justifyContent: 'flex-start',
          textAlign: 'left',
          backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
          borderRadius: '9px',
          // 1.5px primary border in resting state — the design handoff
          // specifies this so the field reads as the primary control in
          // the form. Switches to error red when invalid, stays primary
          // when open, and adds a 3px focus ring on open.
          border: `1.5px solid ${
            invalid
              ? `var(--color-error-text, ${Colors.ColorRed700})`
              : `var(--color-primary, ${Colors.ColorBlue500})`
          }`,
          boxShadow: open
            ? `0 0 0 3px var(--color-primary-focused, rgba(0, 103, 223, 0.15))`
            : 'none',
          transition: 'border-color 120ms, box-shadow 120ms',
          color: `var(--color-foreground, ${Colors.ColorGray850})`,
          '&:hover': {
            borderColor: invalid
              ? `var(--color-error-text, ${Colors.ColorRed700})`
              : `var(--color-primary-hover, ${Colors.ColorBlue600})`,
          },
          '&.Mui-disabled': { opacity: 0.5 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexWrap: 'nowrap',
          }}
        >
          {selected ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  color: `var(--color-foreground, ${Colors.ColorGray850})`,
                }}
              >
                {primary}
              </Typography>
              {inlineTags.map((t) => (
                <Box key={`${t.kind}-${t.label}`} sx={{ flexShrink: 0 }}>
                  <ModelTagChip tag={t} variants={tagVariants} />
                </Box>
              ))}
            </>
          ) : unknownValue ? (
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                color: `var(--color-error-text, ${Colors.ColorRed700})`,
              }}
              title={_({
                id: 'modelPicker.trigger.unknownValueTooltip',
                message:
                  '"{value}" is no longer available in this catalog. Pick a replacement to ensure your workflow continues to run.',
                values: { value: unknownValue },
              })}
            >
              {unknownValue}
            </Typography>
          ) : (
            <Typography
              variant="body1"
              sx={{
                color: `var(--color-foreground-disable, ${Colors.ColorGray500})`,
                fontSize: 14,
              }}
            >
              {placeholder}
            </Typography>
          )}
        </Box>
        {extra && (
          <Box
            sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            {extra}
          </Box>
        )}
        <KeyboardArrowDownIcon
          sx={{
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
            // 18px per the design handoff's field spec.
            fontSize: 18,
          }}
        />
      </ButtonBase>
    </Box>
  );
};
