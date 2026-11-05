import { Asterisk } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormFieldHeader } from '@/components/ui/form-field';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { COLLAPSED_HIDDEN, COLLAPSED_ONLY, FIELD_ACTION_CLASS } from '../../field-actions/collapse';
import type { QuickFieldType, QuickFormFieldOption, QuickFormFieldStrings } from '../types';
import type { VariablePickerSource } from '../utils';
import { AiAssistControl, InsertVariableControl, TypePickerControl } from './header-actions';
import { type HeaderActionKind, HeaderContext, type HeaderContextValue } from './header-context';

const NO_CLAIMS: Record<HeaderActionKind, number> = { type: 0, ai: 0, insert: 0 };

/**
 * While the editable label is open, each box around it grows to the header's actions, so the
 * editor fills that space instead of an `<input>`'s default width. Read mode keeps them sized to
 * the label, so the asterisk and info icon stay beside the text.
 */
export const GROW_WHILE_EDITING = 'has-[[data-slot=editable-text-input]]:flex-1';

export function FieldHeader({
  label,
  labelAddon,
  tooltip,
  fieldId,
  fieldLabel,
  required,
  fieldType,
  fieldTypes,
  onFieldTypeChange,
  onRequiredChange,
  compact,
  disabled,
  isExpression,
  showFieldActions,
  onValueChange,
  variables,
  onGenerateWithAi,
  onInsertVariable,
  strings,
  headerActions,
}: {
  label?: ReactNode;
  labelAddon?: ReactNode;
  tooltip?: ReactNode;
  fieldId: string;
  fieldLabel: string;
  required?: boolean;
  fieldType: QuickFieldType;
  /** See QuickFormFieldProps.fieldTypes. */
  fieldTypes?: readonly QuickFieldType[];
  onFieldTypeChange?: (fieldType: QuickFieldType) => void;
  onRequiredChange?: (required: boolean) => void;
  compact?: boolean;
  disabled: boolean;
  /** Whether the AI output is described as an expression rather than a value. */
  isExpression: boolean;
  showFieldActions: boolean;
  onValueChange?: (value: string) => void;
  variables: VariablePickerSource;
  onGenerateWithAi?: (prompt: string) => void;
  /** See QuickFormFieldProps.onInsertVariable. Omitted, the Insert action does not render. */
  onInsertVariable?: (variable: QuickFormFieldOption) => void;
  /** See QuickFormFieldStrings. */
  strings: QuickFormFieldStrings;
  headerActions?: ReactNode;
}) {
  const collapsedTextClass = cn(COLLAPSED_HIDDEN, compact && '!hidden');
  const compactOnlyClass = cn(COLLAPSED_ONLY, compact && '!flex');

  // How many composed actions of each kind are mounted; a built-in steps aside for any of them.
  const [claims, setClaims] = useState(NO_CLAIMS);
  const claim = useCallback((kind: HeaderActionKind) => {
    setClaims((c) => ({ ...c, [kind]: c[kind] + 1 }));
    return () => setClaims((c) => ({ ...c, [kind]: c[kind] - 1 }));
  }, []);
  const claimed = { type: claims.type > 0, ai: claims.ai > 0, insert: claims.insert > 0 };
  const header = useMemo<HeaderContextValue>(
    () => ({
      fieldType,
      isExpression,
      disabled,
      compact: !!compact,
      strings,
      variables,
      insertVariable: onInsertVariable,
      canInsert: !!onValueChange,
      claim,
    }),
    [
      fieldType,
      isExpression,
      disabled,
      compact,
      strings,
      variables,
      onInsertVariable,
      onValueChange,
      claim,
    ]
  );

  const hasActions =
    !!onFieldTypeChange || !!onRequiredChange || showFieldActions || headerActions != null;
  // A blank string is no tooltip, as in FormFieldLabel: an info trigger onto nothing is worse.
  const hasTooltip =
    tooltip != null && tooltip !== false && !(typeof tooltip === 'string' && !tooltip.trim());
  // FormFieldHeader places the tooltip after its own label; beside any other, it is placed here.
  const ownLabel =
    label != null && hasTooltip ? (
      <span
        className={cn(
          'flex min-w-0 items-center',
          GROW_WHILE_EDITING,
          // The reference it shows follows the label, so it waits until the edit is done.
          '[&:has([data-slot=editable-text-input])>[data-slot=info-tooltip]]:hidden'
        )}
      >
        {label}
        <InfoTooltip content={tooltip} aria-label={strings.tooltipAriaLabel} />
      </span>
    ) : (
      label
    );
  const leading =
    labelAddon != null ? (
      <>
        {labelAddon}
        {ownLabel}
      </>
    ) : (
      ownLabel
    );
  // A consumer's own label is not wrapped in FormFieldHeader's <label>: it may hold controls of
  // its own. With nothing beside it, the header would render nothing, so it stands alone.
  if (label != null && !hasActions) {
    const alone =
      labelAddon != null ? (
        <div className={cn('flex min-w-0 items-center gap-2', GROW_WHILE_EDITING)}>{leading}</div>
      ) : (
        ownLabel
      );
    return hasTooltip ? <TooltipProvider delayDuration={300}>{alone}</TooltipProvider> : alone;
  }

  return (
    <HeaderContext.Provider value={header}>
      <TooltipProvider delayDuration={300}>
        <FormFieldHeader
          // FormFieldHeader's label area is its first child and its actions the second. While the
          // label is edited, the actions step aside so a narrow header still has room to type
          // (important, since the actions row sets its display inline). The header's own `min-h-6`
          // holds the row's height meanwhile.
          className="[&:has([data-slot=editable-text-input])>:first-child]:flex-1 [&:has([data-slot=editable-text-input])>:nth-child(2)]:!hidden"
          label={label == null ? fieldLabel : undefined}
          htmlFor={fieldId}
          required={required}
          tooltip={label == null ? tooltip : undefined}
          tooltipAriaLabel={strings.tooltipAriaLabel}
          leading={leading}
          actions={
            hasActions ? (
              // One group, so composed actions sit as close together as the built-ins.
              <div className="flex items-center gap-0.5">
                {onFieldTypeChange && !claimed.type && (
                  <TypePickerControl
                    header={header}
                    value={fieldType}
                    types={fieldTypes}
                    onValueChange={onFieldTypeChange}
                  />
                )}
                {onRequiredChange && (
                  <>
                    <div className={collapsedTextClass}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* Wrapped in a span: TooltipTrigger's asChild merge otherwise
                            overwrites the Switch's own data-state (checked/unchecked)
                            with the tooltip's open/closed state, breaking its color classes. */}
                          <span className="inline-flex">
                            <Switch
                              size="sm"
                              checked={!!required}
                              onCheckedChange={onRequiredChange}
                              disabled={disabled}
                              className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                              aria-label={
                                required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                              }
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{strings.requiredTooltip}</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className={compactOnlyClass}>
                      <Popover>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="3xs"
                                icon
                                aria-label={
                                  required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                                }
                                disabled={disabled}
                                className={FIELD_ACTION_CLASS}
                              >
                                <Asterisk />
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent>{strings.requiredTooltip}</TooltipContent>
                        </Tooltip>
                        <PopoverContent align="end" className="w-48">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-foreground">
                              {strings.requiredTooltip}
                            </span>
                            <Switch
                              size="sm"
                              checked={!!required}
                              onCheckedChange={onRequiredChange}
                              disabled={disabled}
                              className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                              aria-label={
                                required ? strings.requiredAriaLabel : strings.optionalAriaLabel
                              }
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
                {showFieldActions && (
                  <>
                    {onGenerateWithAi && !claimed.ai && (
                      <AiAssistControl header={header} onGenerate={onGenerateWithAi} />
                    )}
                    {!claimed.insert && <InsertVariableControl header={header} />}
                  </>
                )}
                {headerActions}
              </div>
            ) : undefined
          }
        />
      </TooltipProvider>
    </HeaderContext.Provider>
  );
}
