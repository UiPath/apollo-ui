import { RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { EditableText } from '@/components/ui/editable-text';
import { FileUpload } from '@/components/ui/file-upload';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { RequiredIndicator } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PromptValueControl } from '@/components/ui/prompt-value-control';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { VariableValueControl } from '@/components/ui/variable-value-control';
import { cn } from '@/lib';
import { toDateValue } from '@/lib/date-value';
import { FieldMenu, type FieldMenuItem } from '../field-addons/field-menu';
import { ValueModeSwitchDialog } from '../field-addons/value-mode-switch-dialog';
import { FieldHeader, GROW_WHILE_EDITING } from './components/field-header';
import { LockToggleButton } from './components/lock-toggle-button';
import type {
  QuickFormFieldControlProps,
  QuickFormFieldMode,
  QuickFormFieldModeSwitchConfirm,
  QuickFormFieldProps,
} from './types';
import { DEFAULT_QUICK_FORM_FIELD_STRINGS, FIELD_TYPE_META } from './types';
import {
  DEFAULT_SELECT_OPTIONS,
  formatDateValue,
  parseListValue,
  toDateOnlyString,
  toVariablePickerSource,
} from './utils';

const DEFAULT_VALUE_MODES: readonly QuickFormFieldMode[] = ['literal', 'expression'];

/**
 * A Quick Form is assembled by end users, like a form builder. QuickFormField is
 * the control for an individual field within it, and carries its own
 * configuration controls: a lock that marks it read-only for the person filling
 * in the form, a data-type switch that swaps the control, a Required toggle, and
 * a value-mode switch across `literal`, `expression`, `variable` and `prompt`.
 *
 * Only use it within a quick form builder. For standard forms, compose the
 * form-field anatomy (`FormField`, `FormFieldLabel`, `InputGroup`, …) or
 * describe them to `MetadataForm`.
 *
 * - Every mode has a built-in control: `variable` is a picker over
 *   `variables`, `prompt` an agent textarea. `valueModes` chooses which the
 *   menu offers, and `renderModeControl` replaces the control for any mode.
 * - `confirmModeChange` asks before a switch the consumer knows is lossy.
 * - `locked` is configuration the author sets, so the value stays editable;
 *   `disabled` is what stops the author editing the field.
 * - `fieldTypes` chooses which types the picker offers.
 * - `onLabelChange` makes a string `label` editable in place.
 * - Insert variable renders `variables` as supplied and splices at the caret;
 *   `onInsertVariable` takes over what inserting means.
 * - Enter commits through `onValueBlur`, Escape restores the value as of focus.
 *   In a text area Shift+Enter adds a new line.
 * - Every user-visible string can be overridden through `strings`.
 *
 * The expression mode is styled as code but not highlighted or evaluated.
 * Select options default to a small demo set unless `options` is provided. The
 * AI-assist button renders only with `onGenerateWithAi`, and file uploads
 * aren't persisted anywhere.
 */
export function QuickFormField({
  value = '',
  onValueChange,
  onValueBlur,
  locked = true,
  onLockedChange,
  showLock = true,
  disabled = false,
  leadingAddon,
  trailingAddon,
  more,
  mode = 'literal',
  onModeChange,
  valueModes = DEFAULT_VALUE_MODES,
  confirmModeChange,
  renderExpressionEditor,
  renderModeControl,
  fieldType = 'string',
  fieldTypes,
  onFieldTypeChange,
  required,
  onRequiredChange,
  label,
  onLabelChange,
  isEditingLabel,
  onIsEditingLabelChange,
  labelAddon,
  tooltip,
  strings: stringOverrides,
  placeholder,
  error,
  errorId,
  belowValue,
  fileUploadAriaLabel,
  headerActions,
  compact,
  showFieldActions = true,
  options = DEFAULT_SELECT_OPTIONS,
  onGenerateWithAi,
  onInsertVariable,
  variables = [],
  id,
  className,
}: QuickFormFieldProps) {
  // Memoized so FieldHeader and LockToggleButton get a stable object.
  const strings = useMemo(
    () => ({ ...DEFAULT_QUICK_FORM_FIELD_STRINGS, ...stringOverrides }),
    [stringOverrides]
  );
  const generatedId = useId().replace(/:/g, '');
  // The component owns its input, so caret-aware insert and Enter/Escape live
  // here instead of behind an exposed ref.
  const valueInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const committedRef = useRef(value);
  // Null until the author places a caret: a never-focused input reports
  // selectionStart 0, which would prepend an inserted variable.
  const caretRef = useRef<{ start: number; end: number } | null>(null);
  // The variable trigger or prompt textarea, for focus on a mode switch.
  const modeControlRef = useRef<HTMLElement | null>(null);
  const setModeControl = useCallback((el: HTMLElement | null) => {
    modeControlRef.current = el;
  }, []);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  // The label as typed, until it is committed or reverted. Null while it matches `label`, so a
  // label the consumer changes meanwhile still shows.
  const [labelDraft, setLabelDraft] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<
    QuickFormFieldModeSwitchConfirm & { to: QuickFormFieldMode }
  >();
  // Shared by the Insert menu and the variable-mode picker. Memoized because it
  // rebuilds the tree recursively, which every row did on every render.
  const variablePicker = useMemo(() => toVariablePickerSource(variables), [variables]);
  const fieldId = id ?? generatedId;
  const validationId = errorId ?? `${fieldId}-error`;
  const typeMeta = FIELD_TYPE_META[fieldType];
  const editableOnValueChange = disabled ? undefined : onValueChange;
  const typeLabel = strings.typeLabels[fieldType] ?? typeMeta.label;
  const fieldLabel =
    mode === 'expression'
      ? strings.expressionFieldLabel(typeLabel)
      : strings.valueFieldLabel(typeLabel);
  // The consumer's wording wins on the control; the computed name still labels
  // the field for assistive tech.
  const valuePlaceholder = placeholder ?? fieldLabel;
  const menuActions: FieldMenuItem[] = [
    ...(more?.onClear
      ? [
          {
            id: 'clear',
            label: strings.clearValue,
            icon: Trash2,
            destructive: true,
            onSelect: more.onClear,
          },
        ]
      : []),
    ...(more?.onRefresh
      ? [{ id: 'refresh', label: strings.forceRefresh, icon: RefreshCw, onSelect: more.onRefresh }]
      : []),
  ];
  const valueModeStrings = {
    ...strings.valueModes,
    literalTitle: strings.literalLabels[fieldType] ?? typeMeta.fixedLabel,
    expressionTitle: strings.expressionLabel,
    expressionDescription: strings.expressionDescription,
    fieldActions: strings.moreActionsAriaLabel,
  };
  // Set when a switch goes through, so the menu or dialog closing behind it leaves focus on the
  // new control rather than returning it to where it opened from.
  const focusControlOnClose = useRef(false);
  const keepControlFocus = (event: Event) => {
    if (!focusControlOnClose.current) return;
    focusControlOnClose.current = false;
    event.preventDefault();
    (valueInputRef.current ?? modeControlRef.current)?.focus();
  };
  const selectMode = (next: QuickFormFieldMode) => {
    if (!onModeChange) return;
    const confirm = next !== mode && confirmModeChange?.(mode, next);
    if (confirm) {
      setPendingSwitch({ ...(confirm === true ? {} : confirm), to: next });
      return;
    }
    focusControlOnClose.current = next !== mode;
    onModeChange(next);
  };
  // Modes and actions share one menu. A field that cannot switch offers only its actions; with
  // neither, it keeps a disabled mode trigger so the field still shows how its value is expressed.
  const switchable = !!onModeChange && valueModes.length > 1;
  const builtInMenu = (
    <FieldMenu
      mode={mode}
      modes={[...valueModes]}
      onSelect={selectMode}
      modesDisabled={!switchable && menuActions.length > 0}
      disabled={disabled || (!switchable && menuActions.length === 0)}
      actions={menuActions}
      triggerLabel={strings.valueModeAriaLabel}
      literalDescription={strings.literalDescriptions[fieldType] ?? typeMeta.fixedDescription}
      strings={valueModeStrings}
      onCloseAutoFocus={keepControlFocus}
    />
  );

  const controlProps: QuickFormFieldControlProps = {
    id: fieldId,
    value,
    onValueChange: editableOnValueChange,
    onBlur: onValueBlur,
    readOnly: !editableOnValueChange,
    disabled,
    placeholder: valuePlaceholder,
    fieldType,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? validationId : undefined,
    'aria-errormessage': error ? validationId : undefined,
    'data-slot': 'input-group-control',
  };

  // Resolved before the tree so returning nothing falls back to the built-in control.
  const modeControl = renderModeControl?.(mode, controlProps) ?? null;
  const builtInVariable = modeControl === null && mode === 'variable';
  const builtInPrompt = modeControl === null && mode === 'prompt';

  // Switching mode is a prelude to writing the value, so focus the control.
  // Skipped on mount so rendering a form cannot steal focus.
  const modeOnMount = useRef(mode);
  useEffect(() => {
    if (modeOnMount.current === mode) return;
    modeOnMount.current = mode;
    // A frame later: a popover trigger, as the variable picker is, remounts once
    // its anchor registers, which would drop focus given now.
    const frame = requestAnimationFrame(() =>
      (valueInputRef.current ?? modeControlRef.current)?.focus()
    );
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  // Enter blurs, so a consumer commits in `onValueBlur` as it already does.
  // Escape restores the value as of focus, which only the component knows.
  // A text area keeps Shift+Enter for its line breaks.
  const handleValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newLine = e.shiftKey && e.currentTarget instanceof HTMLTextAreaElement;
    if (e.key === 'Enter' && !newLine) {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      editableOnValueChange?.(committedRef.current);
      e.currentTarget.blur();
    }
  };

  // The component renders both the input and the Insert menu, so it splices at
  // its own caret rather than making consumers hold a ref.
  const insertVariableAtCaret = (insertText: string) => {
    const input = valueInputRef.current;
    const caret = caretRef.current;
    // No input, or no caret placed yet: append, which is what "insert" means
    // when the author has not said where.
    if (!input || !caret) {
      onValueChange?.(value ? `${value} ${insertText}` : insertText);
      return;
    }
    const start = Math.min(caret.start, value.length);
    const end = Math.min(Math.max(caret.end, start), value.length);
    const next = value.slice(0, start) + insertText + value.slice(end);
    onValueChange?.(next);
    const next_caret = start + insertText.length;
    caretRef.current = { start: next_caret, end: next_caret };
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(next_caret, next_caret);
    });
  };

  // A callback ref, so one ref can hold either the input or the text area.
  const setValueInput = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    valueInputRef.current = el;
  }, []);

  // Shared by the expression input and the literal text input and text area,
  // which all track the caret for Insert variable.
  const textInputProps = {
    id: fieldId,
    ref: setValueInput,
    readOnly: !editableOnValueChange,
    disabled,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      editableOnValueChange?.(e.target.value),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      committedRef.current = value;
      caretRef.current = {
        start: e.currentTarget.selectionStart ?? value.length,
        end: e.currentTarget.selectionEnd ?? value.length,
      };
    },
    onSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      caretRef.current = {
        start: el.selectionStart ?? 0,
        end: el.selectionEnd ?? el.selectionStart ?? 0,
      };
    },
    onKeyDown: handleValueKeyDown,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Clicking the Insert trigger blurs this input, so this is the last
      // moment the caret is knowable.
      caretRef.current = {
        start: e.currentTarget.selectionStart ?? value.length,
        end: e.currentTarget.selectionEnd ?? value.length,
      };
      onValueBlur?.();
    },
    placeholder: valuePlaceholder,
  };

  const literalControl =
    fieldType === 'boolean' ? (
      <div className="flex h-full flex-1 items-center px-3">
        <Switch
          id={fieldId}
          aria-invalid={controlProps['aria-invalid']}
          aria-describedby={controlProps['aria-describedby']}
          aria-errormessage={controlProps['aria-errormessage']}
          checked={value === 'true'}
          onCheckedChange={(checked) => editableOnValueChange?.(String(checked))}
          onBlur={onValueBlur}
          disabled={!editableOnValueChange}
        />
      </div>
    ) : fieldType === 'date' ? (
      <Popover
        open={datePopoverOpen}
        onOpenChange={(open) => {
          setDatePopoverOpen(open);
          if (!open) onValueBlur?.();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            id={fieldId}
            data-slot="input-group-control"
            aria-invalid={controlProps['aria-invalid']}
            aria-describedby={controlProps['aria-describedby']}
            aria-errormessage={controlProps['aria-errormessage']}
            disabled={!editableOnValueChange}
            className="flex h-full flex-1 items-center text-left text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {value ? (
              formatDateValue(value)
            ) : (
              <span className="text-muted-foreground">{strings.pickDate}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={toDateValue(value)}
            onSelect={(date) => editableOnValueChange?.(date ? toDateOnlyString(date) : '')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    ) : fieldType === 'datetime' ? (
      // A timestamp needs the time of day, so it uses DateTimePicker rather
      // than the date branch's Calendar popover. Stored as an ISO string.
      <DateTimePicker
        id={fieldId}
        value={toDateValue(value)}
        onValueChange={(date) => editableOnValueChange?.(date ? date.toISOString() : '')}
        onOpenChange={(open) => {
          if (!open) onValueBlur?.();
        }}
        disabled={!editableOnValueChange}
        placeholder={valuePlaceholder}
      />
    ) : fieldType === 'file' ? (
      <FileUpload
        id={fieldId}
        ariaLabel={fileUploadAriaLabel ?? (typeof label === 'string' ? label : fieldLabel)}
        className="flex-1"
        onFilesChange={(files) => editableOnValueChange?.(files.map((f) => f.name).join(', '))}
        disabled={!editableOnValueChange}
        onBlur={onValueBlur}
        aria-invalid={controlProps['aria-invalid']}
        aria-describedby={controlProps['aria-describedby']}
        aria-errormessage={controlProps['aria-errormessage']}
      />
    ) : fieldType === 'single-select' ? (
      <Select
        open={selectOpen}
        onOpenChange={(open) => {
          setSelectOpen(open);
          if (!open && selectOpen) onValueBlur?.();
        }}
        value={value || undefined}
        onValueChange={editableOnValueChange}
        disabled={!editableOnValueChange}
      >
        <SelectTrigger id={fieldId}>
          <SelectValue placeholder={strings.selectOption} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : fieldType === 'multi-select' ? (
      <MultiSelect
        id={fieldId}
        options={options}
        selected={parseListValue(value)}
        onChange={(selected) => editableOnValueChange?.(JSON.stringify(selected))}
        placeholder={strings.selectOptions}
        searchPlaceholder={strings.multiSelectSearchPlaceholder}
        emptyMessage={strings.multiSelectEmpty}
        clearAllText={strings.multiSelectClearAll}
        strings={strings.multiSelect}
        // One line, as every other row is; chips past the width count as "+N more".
        overflow="collapse"
        disabled={!editableOnValueChange}
        onBlur={onValueBlur}
      />
    ) : fieldType === 'textarea' ? (
      // Starts one line tall like a text field, then grows with its content up to 8 rows.
      <InputGroupTextarea
        {...textInputProps}
        rows={1}
        minRows={1}
        maxRows={8}
        className="py-[3px] future:py-0.5"
      />
    ) : (
      <InputGroupInput
        {...textInputProps}
        // `step="any"` lets a `double` accept fractions; the default step of 1
        // makes "10.5" invalid.
        type={fieldType === 'integer' || fieldType === 'double' ? 'number' : 'text'}
        step={fieldType === 'double' ? 'any' : undefined}
      />
    );

  // A pick replaces the binding. `onInsertVariable` takes it when supplied, so
  // the consumer gets its own entry, type and all.
  const canPickVariable = !disabled && (!!onInsertVariable || !!onValueChange);
  const variableControl = (
    <VariableValueControl
      id={fieldId}
      value={value}
      onChange={(reference, item) =>
        onInsertVariable && item
          ? onInsertVariable(variablePicker.resolve(item), { value, caret: null })
          : onValueChange?.(reference)
      }
      onBlur={onValueBlur}
      inputRef={setModeControl}
      variables={variablePicker.items}
      disabled={!canPickVariable}
      placeholder={placeholder}
      strings={strings.valueModes}
      aria-describedby={controlProps['aria-describedby']}
    />
  );

  const promptControl = (
    <PromptValueControl
      id={fieldId}
      value={value}
      onChange={(next) => editableOnValueChange?.(next)}
      onBlur={onValueBlur}
      inputRef={setModeControl}
      disabled={!editableOnValueChange}
      placeholder={placeholder}
      strings={strings.valueModes}
      aria-describedby={controlProps['aria-describedby']}
    />
  );

  const editableLabel =
    typeof label === 'string' && onLabelChange ? (
      <span className={cn('flex min-w-0 items-center', GROW_WHILE_EDITING)}>
        <EditableText
          size="label"
          value={labelDraft ?? label}
          placeholder={strings.labelPlaceholder}
          aria-label={strings.labelAriaLabel}
          editing={isEditingLabel}
          onEditingChange={onIsEditingLabelChange}
          disabled={disabled}
          onChange={(next) => setLabelDraft(next === label ? null : next)}
          onSubmit={(next) => {
            setLabelDraft(null);
            onLabelChange(next);
          }}
        />
        {required && <RequiredIndicator />}
      </span>
    ) : undefined;

  return (
    <div
      className={cn(
        '@container group flex flex-col gap-1.5 [&>[data-slot=form-field-error]]:mt-0',
        className
      )}
    >
      <FieldHeader
        label={editableLabel ?? label}
        labelAddon={labelAddon}
        tooltip={tooltip}
        fieldId={fieldId}
        fieldLabel={fieldLabel}
        required={required}
        fieldType={fieldType}
        fieldTypes={fieldTypes}
        onFieldTypeChange={onFieldTypeChange}
        onRequiredChange={onRequiredChange}
        compact={compact}
        disabled={disabled}
        isExpression={mode === 'expression'}
        showFieldActions={showFieldActions}
        onValueChange={editableOnValueChange}
        variables={variablePicker}
        onGenerateWithAi={onGenerateWithAi}
        // The variable picker is the value control there, so the header has nothing to insert into.
        onInsertVariable={
          builtInVariable
            ? undefined
            : (variable) =>
                onInsertVariable
                  ? onInsertVariable(variable, { value, caret: caretRef.current })
                  : insertVariableAtCaret(variable.value)
        }
        headerActions={headerActions}
        strings={strings}
      />

      <InputGroup
        error={error}
        errorId={validationId}
        disabled={disabled}
        // The agent tint marks the value as a prompt. The prompt, the dropzone and a text area
        // are taller than a row, so the box grows to hold them.
        variant={builtInPrompt ? 'agent' : undefined}
        layout={
          builtInPrompt ||
          (mode === 'literal' && (fieldType === 'file' || fieldType === 'textarea'))
            ? 'grow'
            : 'row'
        }
      >
        {(showLock || leadingAddon !== undefined) && leadingAddon !== null && (
          <InputGroupAddon align="inline-start">
            {leadingAddon !== undefined
              ? leadingAddon
              : showLock && (
                  <LockToggleButton
                    locked={locked}
                    onLockedChange={onLockedChange}
                    disabled={disabled}
                    strings={strings}
                  />
                )}
          </InputGroupAddon>
        )}

        {modeControl ??
          (mode === 'expression' ? (
            renderExpressionEditor ? (
              renderExpressionEditor(controlProps)
            ) : (
              <InputGroupInput {...textInputProps} className="font-mono" />
            )
          ) : builtInVariable ? (
            variableControl
          ) : builtInPrompt ? (
            promptControl
          ) : (
            literalControl
          ))}

        {trailingAddon !== null && (
          <InputGroupAddon align="inline-end" className="cursor-default">
            {trailingAddon !== undefined ? trailingAddon : builtInMenu}
          </InputGroupAddon>
        )}
      </InputGroup>

      {belowValue}

      <ValueModeSwitchDialog
        open={!!pendingSwitch}
        title={pendingSwitch?.title}
        description={pendingSwitch?.description}
        confirmLabel={pendingSwitch?.confirmLabel}
        strings={strings.valueModes}
        onCancel={() => setPendingSwitch(undefined)}
        onConfirm={() => {
          // The field may have been disabled while the dialog was open.
          if (pendingSwitch && !disabled) {
            focusControlOnClose.current = true;
            onModeChange?.(pendingSwitch.to);
          }
          setPendingSwitch(undefined);
        }}
        onCloseAutoFocus={keepControlFocus}
      />
    </div>
  );
}
