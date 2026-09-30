import { Code2, MoreHorizontal, RefreshCw, Trash2, Type } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileUpload } from '@/components/ui/file-upload';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { MultiSelect } from '@/components/ui/multi-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib';
import { FieldHeader } from './components/field-header';
import { LockToggleButton } from './components/lock-toggle-button';
import { ModeMenuItem } from './components/mode-menu-item';
import type { LockableValueFieldProps } from './types';
import {
  DEFAULT_STRINGS,
  FIELD_TYPE_META,
  type LockableValueFieldMoreActions,
  type LockableValueFieldStrings,
} from './types';
import {
  DEFAULT_SELECT_OPTIONS,
  formatDateValue,
  getLockedDisplayValue,
  parseDateValue,
  parseListValue,
  toDateOnlyString,
} from './utils';

function MoreActionsMenu({
  more,
  locked,
  strings,
}: {
  more: LockableValueFieldMoreActions;
  locked: boolean;
  strings: LockableValueFieldStrings;
}) {
  const onClear = locked ? undefined : more.onClear;
  const onRefresh = more.onRefresh;

  if (!onClear && !onRefresh) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton icon size="3xs" aria-label={strings.moreActionsAriaLabel}>
          <MoreHorizontal />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {onClear && (
          <DropdownMenuItem className="text-error focus:text-error" onClick={onClear}>
            <Trash2 />
            {strings.clearValue}
          </DropdownMenuItem>
        )}
        {onRefresh && (
          <DropdownMenuItem onClick={onRefresh}>
            <RefreshCw />
            {strings.forceRefresh}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * LockableValueField: a field that can be locked to read-only, typed as one of
 * several data types, and expressed in one of four modes (`literal`,
 * `expression`, `variable`, `prompt`).
 *
 * - Literal and expression have built-in controls; `renderModeControl`
 *   supplies the control for any mode, and `variable` / `prompt` need it.
 * - `fieldTypes` chooses which types the picker offers.
 * - Insert variable renders `variables` as supplied and splices at the caret;
 *   `onInsertVariable` takes over what inserting means.
 * - Enter commits through `onValueBlur`, Escape restores the value as of focus.
 * - Every user-visible string can be overridden through `strings`.
 *
 * The expression mode is styled as code but not highlighted or evaluated.
 * Select options default to a small demo set unless `options` is provided. The
 * AI-assist button renders only with `onGenerateWithAi`, and file uploads
 * aren't persisted anywhere.
 */
export function LockableValueField({
  value = '',
  onValueChange,
  onValueBlur,
  locked = true,
  onLockedChange,
  showLock = true,
  leadingAddon,
  trailingAddon,
  more,
  mode = 'literal',
  onModeChange,
  renderExpressionEditor,
  renderModeControl,
  fieldType = 'string',
  fieldTypes,
  onFieldTypeChange,
  required,
  onRequiredChange,
  label,
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
}: LockableValueFieldProps) {
  // Memoized so FieldHeader, LockToggleButton and MoreActionsMenu get a stable object.
  const strings = useMemo(() => ({ ...DEFAULT_STRINGS, ...stringOverrides }), [stringOverrides]);
  const generatedId = useId().replace(/:/g, '');
  // The component owns its input, so caret-aware insert and Enter/Escape live
  // here instead of behind an exposed ref.
  const valueInputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(value);
  // Null until the author places a caret: a never-focused input reports
  // selectionStart 0, which would prepend an inserted variable.
  const caretRef = useRef<{ start: number; end: number } | null>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const fieldId = id ?? generatedId;
  const validationId = errorId ?? `${fieldId}-error`;
  const typeMeta = FIELD_TYPE_META[fieldType];
  // Only `expression` is coerced: a select cannot hold JS, but it can still be
  // bound to a variable or filled by a prompt.
  const effectiveMode = mode === 'expression' && !typeMeta.supportsExpression ? 'literal' : mode;
  const editableOnValueChange = locked ? undefined : onValueChange;
  const typeLabel = strings.typeLabels[fieldType] ?? typeMeta.label;
  const fieldLabel =
    effectiveMode === 'expression'
      ? strings.expressionFieldLabel(typeLabel)
      : strings.valueFieldLabel(typeLabel);
  // The consumer's wording wins on the control; the computed name still labels
  // the field for assistive tech.
  const valuePlaceholder = placeholder ?? fieldLabel;
  const hasMoreActions = Boolean(more?.onRefresh || (!locked && more?.onClear));

  // Resolved before the tree so returning nothing falls back to the built-in
  // control. Offered the raw mode, not `effectiveMode`: the coercion protects
  // the built-in rendering and must not decide for a consumer with its own editor.
  const modeControl =
    renderModeControl?.(mode, {
      id: fieldId,
      value,
      onValueChange: editableOnValueChange,
      onBlur: onValueBlur,
      readOnly: !editableOnValueChange,
      placeholder: valuePlaceholder,
      fieldType,
    }) ?? null;

  // Switching mode is a prelude to writing the value, so focus the control.
  // Skipped on mount so rendering a form cannot steal focus.
  const modeOnMount = useRef(mode);
  useEffect(() => {
    if (modeOnMount.current === mode) return;
    modeOnMount.current = mode;
    valueInputRef.current?.focus();
  }, [mode]);

  // Enter blurs, so a consumer commits in `onValueBlur` as it already does.
  // Escape restores the value as of focus, which only the component knows.
  const handleValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onValueChange?.(committedRef.current);
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

  // Locked fields are read-only, not disabled — the raw control (switch, date
  // picker, select) has nothing left to do once editing is blocked, so it's
  // replaced with plain, selectable text showing the same value.
  const lockedDisplayValue = getLockedDisplayValue(fieldType, value, options, strings);

  return (
    <div
      className={cn(
        '@container group flex flex-col gap-1.5 [&>[data-slot=form-field-error]]:mt-0',
        className
      )}
    >
      <FieldHeader
        label={label}
        fieldId={fieldId}
        fieldLabel={fieldLabel}
        required={required}
        fieldType={fieldType}
        fieldTypes={fieldTypes}
        onFieldTypeChange={onFieldTypeChange}
        onRequiredChange={onRequiredChange}
        compact={compact}
        showFieldActions={showFieldActions}
        onValueChange={editableOnValueChange}
        variables={variables}
        onGenerateWithAi={onGenerateWithAi}
        onInsertVariable={(variable) =>
          onInsertVariable
            ? onInsertVariable(variable, { value, caret: caretRef.current })
            : insertVariableAtCaret(variable.value)
        }
        headerActions={headerActions}
        strings={strings}
      />

      {typeMeta.supportsExpression ? (
        <InputGroup
          error={error}
          errorId={validationId}
          className={cn(
            fieldType === 'file' && !locked && effectiveMode === 'literal' && 'h-auto items-stretch'
          )}
        >
          {(showLock || leadingAddon !== undefined) && leadingAddon !== null && (
            <InputGroupAddon align="inline-start">
              {leadingAddon !== undefined
                ? leadingAddon
                : showLock && (
                    <LockToggleButton
                      locked={locked}
                      onLockedChange={onLockedChange}
                      strings={strings}
                    />
                  )}
            </InputGroupAddon>
          )}

          {modeControl ??
            (effectiveMode === 'expression' ? (
              renderExpressionEditor ? (
                renderExpressionEditor({
                  id: fieldId,
                  value,
                  onValueChange: editableOnValueChange,
                  onBlur: onValueBlur,
                  readOnly: !editableOnValueChange,
                  placeholder: valuePlaceholder,
                  fieldType,
                  'aria-invalid': error ? true : undefined,
                  'aria-describedby': error ? validationId : undefined,
                  'aria-errormessage': error ? validationId : undefined,
                  'data-slot': 'input-group-control',
                })
              ) : (
                <InputGroupInput
                  id={fieldId}
                  ref={valueInputRef}
                  readOnly={!editableOnValueChange}
                  value={value}
                  onChange={(e) => editableOnValueChange?.(e.target.value)}
                  onFocus={(e) => {
                    committedRef.current = value;
                    caretRef.current = {
                      start: e.currentTarget.selectionStart ?? value.length,
                      end: e.currentTarget.selectionEnd ?? value.length,
                    };
                  }}
                  onSelect={(e) => {
                    const el = e.currentTarget;
                    caretRef.current = {
                      start: el.selectionStart ?? 0,
                      end: el.selectionEnd ?? el.selectionStart ?? 0,
                    };
                  }}
                  onKeyDown={handleValueKeyDown}
                  onBlur={(e) => {
                    caretRef.current = {
                      start: e.currentTarget.selectionStart ?? value.length,
                      end: e.currentTarget.selectionEnd ?? value.length,
                    };
                    onValueBlur?.();
                  }}
                  placeholder={valuePlaceholder}
                  className="font-mono"
                />
              )
            ) : locked ? (
              <InputGroupInput
                id={fieldId}
                readOnly
                value={lockedDisplayValue}
                placeholder={valuePlaceholder}
                onBlur={onValueBlur}
              />
            ) : fieldType === 'boolean' ? (
              <div className="flex h-full flex-1 items-center px-3">
                <Switch
                  id={fieldId}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? validationId : undefined}
                  aria-errormessage={error ? validationId : undefined}
                  checked={value === 'true'}
                  onCheckedChange={(checked) => onValueChange?.(String(checked))}
                  onBlur={onValueBlur}
                  disabled={!onValueChange}
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
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? validationId : undefined}
                    aria-errormessage={error ? validationId : undefined}
                    disabled={!onValueChange}
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
                    selected={parseDateValue(value)}
                    onSelect={(date) => onValueChange?.(date ? toDateOnlyString(date) : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : fieldType === 'datetime' ? (
              // A timestamp needs the time of day, so it uses DateTimePicker rather
              // than the date branch's Calendar popover. Stored as an ISO string.
              <DateTimePicker
                id={fieldId}
                className="min-w-0 flex-1"
                value={parseDateValue(value)}
                onValueChange={(date) => onValueChange?.(date ? date.toISOString() : '')}
                disabled={!onValueChange}
                placeholder={valuePlaceholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? validationId : undefined}
                aria-errormessage={error ? validationId : undefined}
              />
            ) : fieldType === 'file' ? (
              <FileUpload
                id={fieldId}
                ariaLabel={fileUploadAriaLabel ?? (typeof label === 'string' ? label : fieldLabel)}
                className="flex-1"
                onFilesChange={(files) => onValueChange?.(files.map((f) => f.name).join(', '))}
                disabled={!onValueChange}
                onBlur={onValueBlur}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? validationId : undefined}
                aria-errormessage={error ? validationId : undefined}
              />
            ) : (
              <InputGroupInput
                id={fieldId}
                ref={valueInputRef}
                // `step="any"` lets a `double` accept fractions; the default step
                // of 1 makes "10.5" invalid.
                type={fieldType === 'integer' || fieldType === 'double' ? 'number' : 'text'}
                step={fieldType === 'double' ? 'any' : undefined}
                readOnly={!onValueChange}
                value={value}
                onChange={(e) => onValueChange?.(e.target.value)}
                onFocus={(e) => {
                  committedRef.current = value;
                  caretRef.current = {
                    start: e.currentTarget.selectionStart ?? value.length,
                    end: e.currentTarget.selectionEnd ?? value.length,
                  };
                }}
                onSelect={(e) => {
                  const el = e.currentTarget;
                  caretRef.current = {
                    start: el.selectionStart ?? 0,
                    end: el.selectionEnd ?? el.selectionStart ?? 0,
                  };
                }}
                onKeyDown={handleValueKeyDown}
                onBlur={(e) => {
                  // Clicking the Insert trigger blurs this input, so this is the
                  // last moment the caret is knowable.
                  caretRef.current = {
                    start: e.currentTarget.selectionStart ?? value.length,
                    end: e.currentTarget.selectionEnd ?? value.length,
                  };
                  onValueBlur?.();
                }}
                placeholder={valuePlaceholder}
              />
            ))}

          {trailingAddon !== null && (
            <InputGroupAddon align="inline-end" className="cursor-default">
              {trailingAddon !== undefined ? (
                trailingAddon
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <InputGroupButton
                        icon
                        size="3xs"
                        disabled={!onModeChange}
                        aria-label={strings.valueModeAriaLabel}
                      >
                        {effectiveMode === 'expression' ? <Code2 /> : <Type />}
                      </InputGroupButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <ModeMenuItem
                        icon={Type}
                        label={strings.literalLabels[fieldType] ?? typeMeta.fixedLabel}
                        description={
                          strings.literalDescriptions[fieldType] ?? typeMeta.fixedDescription
                        }
                        active={effectiveMode === 'literal'}
                        onClick={() => onModeChange?.('literal')}
                      />
                      <ModeMenuItem
                        icon={Code2}
                        label={strings.expressionLabel}
                        description={strings.expressionDescription}
                        active={effectiveMode === 'expression'}
                        onClick={() => onModeChange?.('expression')}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {hasMoreActions && more && (
                    <MoreActionsMenu more={more} locked={locked} strings={strings} />
                  )}
                </>
              )}
            </InputGroupAddon>
          )}
        </InputGroup>
      ) : (
        <InputGroup error={error} errorId={validationId}>
          {(showLock || leadingAddon !== undefined) && leadingAddon !== null && (
            <InputGroupAddon align="inline-start">
              {leadingAddon !== undefined
                ? leadingAddon
                : showLock && (
                    <LockToggleButton
                      locked={locked}
                      onLockedChange={onLockedChange}
                      strings={strings}
                    />
                  )}
            </InputGroupAddon>
          )}

          {modeControl ??
            (locked ? (
              <InputGroupInput
                id={fieldId}
                readOnly
                value={lockedDisplayValue}
                placeholder={valuePlaceholder}
                className="min-w-0"
                onBlur={onValueBlur}
              />
            ) : fieldType === 'single-select' ? (
              <Select
                open={selectOpen}
                onOpenChange={(open) => {
                  setSelectOpen(open);
                  if (!open && selectOpen) onValueBlur?.();
                }}
                value={value || undefined}
                onValueChange={onValueChange}
                disabled={!onValueChange}
              >
                <SelectTrigger
                  id={fieldId}
                  className="min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none future:rounded-none future:border-0 future:bg-transparent future:px-0"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? validationId : undefined}
                  aria-errormessage={error ? validationId : undefined}
                >
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
                className="min-w-0 flex-1"
                options={options}
                selected={parseListValue(value)}
                onChange={(selected) => onValueChange?.(JSON.stringify(selected))}
                placeholder={strings.selectOptions}
                disabled={!onValueChange}
                onBlur={onValueBlur}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? validationId : undefined}
                aria-errormessage={error ? validationId : undefined}
              />
            ) : null)}
          {/* A select can still be bound to a variable, so the consumer's
              trailing control renders here too or it loses its mode switch. */}
          {trailingAddon !== null && (trailingAddon !== undefined || (hasMoreActions && more)) && (
            <InputGroupAddon align="inline-end" className="cursor-default">
              {trailingAddon !== undefined ? (
                trailingAddon
              ) : (
                <MoreActionsMenu more={more!} locked={locked} strings={strings} />
              )}
            </InputGroupAddon>
          )}
        </InputGroup>
      )}

      {belowValue}
    </div>
  );
}
