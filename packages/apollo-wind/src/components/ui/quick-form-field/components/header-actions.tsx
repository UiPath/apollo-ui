import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RenderVariablePicker } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import { AiAssistAction, type AiAssistActionProps } from '../../field-actions/ai-assist-action';
import { COLLAPSED_HIDDEN, FIELD_ACTION_CLASS } from '../../field-actions/collapse';
import { InsertVariableAction } from '../../field-actions/insert-variable-action';
import type { QuickFieldType } from '../types';
import { DEFAULT_QUICK_FORM_FIELD_STRINGS, FIELD_TYPE_META, FIELD_TYPE_ORDER } from '../types';
import { type HeaderContextValue, useClaimHeaderAction, useHeaderContext } from './header-context';

// The actions below read their field from context, so a consumer orders them in `headerActions`
// without wiring each to the field. Each replaces its built-in counterpart while mounted; the
// built-ins render the same controls without claiming.

type WithHeader<P> = P & { header: HeaderContextValue | null };

export interface QuickFormFieldTypePickerProps {
  onValueChange: (fieldType: QuickFieldType) => void;
  /** The type shown as picked. Defaults to the field's `fieldType`. */
  value?: QuickFieldType;
  /** Which types it offers, in display order. Defaults to `FIELD_TYPE_ORDER`. */
  types?: readonly QuickFieldType[];
  /** Disabled while the field is, too. */
  disabled?: boolean;
  /**
   * Icon only, or with its text even in a `compact` field. Defaults to the field's `compact`. Below
   * a 260px `@container` it collapses to its icon either way.
   */
  compact?: boolean;
}

/**
 * The field's type picker, for a QuickFormField's `headerActions`. Labelled from the field's
 * `strings`. Outside a field it needs an ancestor `TooltipProvider`.
 */
export function QuickFormFieldTypePicker(props: QuickFormFieldTypePickerProps) {
  const header = useHeaderContext();
  useClaimHeaderAction(header, 'type');
  return <TypePickerControl {...props} header={header} />;
}

export function TypePickerControl({
  onValueChange,
  value,
  types = FIELD_TYPE_ORDER,
  disabled,
  compact,
  header,
}: WithHeader<QuickFormFieldTypePickerProps>) {
  const strings = header?.strings ?? DEFAULT_QUICK_FORM_FIELD_STRINGS;
  const fieldType = value ?? header?.fieldType ?? 'string';
  const meta = FIELD_TYPE_META[fieldType];
  const collapsedTextClass = cn(COLLAPSED_HIDDEN, (compact ?? header?.compact) && '!hidden');

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="3xs"
              aria-label={strings.fieldTypeAriaLabel}
              disabled={disabled || header?.disabled}
              className={cn('gap-1', FIELD_ACTION_CLASS)}
            >
              <meta.icon />
              <span className={collapsedTextClass}>
                {strings.typeLabels[fieldType] ?? meta.label}
              </span>
              <ChevronDown className={cn('!size-2.5', collapsedTextClass)} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{strings.fieldTypeTooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        {types.map((type) => {
          const option = FIELD_TYPE_META[type];
          const isActive = type === fieldType;
          return (
            <DropdownMenuItem key={type} onClick={() => onValueChange(type)}>
              <option.icon className={isActive ? 'text-brand' : 'text-foreground-muted'} />
              <span className={cn(isActive && 'font-medium text-brand')}>
                {strings.typeLabels[type] ?? option.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface QuickFormFieldAiAssistProps
  extends Pick<AiAssistActionProps, 'onGenerate' | 'renderContent'> {
  /** A line under the prompt. Defaults to what the field's value is, from its `strings`. */
  hint?: ReactNode;
  /** Disabled while the field is, too. */
  disabled?: boolean;
}

/**
 * AI assist for a QuickFormField's `headerActions`, worded from the field's `strings`. Outside a
 * field it needs an ancestor `TooltipProvider`.
 */
export function QuickFormFieldAiAssist(props: QuickFormFieldAiAssistProps) {
  const header = useHeaderContext();
  useClaimHeaderAction(header, 'ai');
  return <AiAssistControl {...props} header={header} />;
}

export function AiAssistControl({
  onGenerate,
  renderContent,
  hint,
  disabled,
  header,
}: WithHeader<QuickFormFieldAiAssistProps>) {
  const strings = header?.strings ?? DEFAULT_QUICK_FORM_FIELD_STRINGS;
  const fieldType = header?.fieldType ?? 'string';
  const typeLabel = strings.typeLabels[fieldType] ?? FIELD_TYPE_META[fieldType].label;

  return (
    <AiAssistAction
      onGenerate={onGenerate}
      renderContent={renderContent}
      disabled={disabled || header?.disabled}
      hint={hint ?? strings.aiOutputHint(strings.aiOutputLabel(typeLabel, !!header?.isExpression))}
      strings={{
        trigger: strings.aiAssistAriaLabel,
        tooltip: strings.aiAssistTooltip,
        prompt: strings.aiPromptLabel,
        promptPlaceholder: strings.aiPromptPlaceholder,
        generate: strings.aiGenerate,
        generating: strings.aiGenerating,
        error: strings.aiError,
      }}
    />
  );
}

export interface QuickFormFieldInsertVariableProps {
  /** The host's own picker, in place of the one over the field's `variables`. */
  renderPicker?: RenderVariablePicker;
  /** Disabled while the field is, or its value read-only, too. */
  disabled?: boolean;
  /**
   * Icon only, or with its text even in a `compact` field. Defaults to the field's `compact`. Below
   * a 260px `@container` it collapses to its icon either way.
   */
  compact?: boolean;
}

/**
 * Insert variable for a QuickFormField's `headerActions`: offers the field's `variables` and
 * inserts at its caret, or through its `onInsertVariable`. Renders nothing outside a field, or
 * while the value is a variable binding, whose picker is the value control.
 */
export function QuickFormFieldInsertVariable(props: QuickFormFieldInsertVariableProps) {
  const header = useHeaderContext();
  useClaimHeaderAction(header, 'insert');
  return <InsertVariableControl {...props} header={header} />;
}

export function InsertVariableControl({
  renderPicker,
  disabled,
  compact,
  header,
}: WithHeader<QuickFormFieldInsertVariableProps>) {
  const insert = header?.insertVariable;
  if (!header || !insert) return null;
  const { strings, variables } = header;

  return (
    <InsertVariableAction
      // Rendered as supplied, so what the tree shows is what it inserts.
      variables={variables.items}
      renderPicker={renderPicker}
      compact={compact}
      disabled={disabled || header.disabled || !header.canInsert}
      strings={{
        label: strings.insertLabel,
        ariaLabel: strings.insertAriaLabel,
        searchPlaceholder: strings.insertSearchPlaceholder,
        empty: strings.insertEmpty,
      }}
      // A host picker's entry is made from its value, which is no id in the field's tree.
      onInsert={(value, item) =>
        insert(renderPicker ? { label: item.label, value } : variables.resolve(item))
      }
    />
  );
}
