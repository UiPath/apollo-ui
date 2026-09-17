import { Code2, MoreHorizontal, RefreshCw, Trash2, Type } from 'lucide-react';
import { useId, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
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
import { FIELD_TYPE_META, type LockableValueFieldMoreActions } from './types';
import {
  DEFAULT_SELECT_OPTIONS,
  formatDateValue,
  parseDateValue,
  parseListValue,
  toDateOnlyString,
} from './utils';

function MoreActionsMenu({ more }: { more: LockableValueFieldMoreActions }) {
  const onClear = more.onClear;
  const onRefresh = more.onRefresh;

  if (!onClear && !onRefresh) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton icon size="3xs" aria-label="More value actions">
          <MoreHorizontal />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {onClear && (
          <DropdownMenuItem className="text-error focus:text-error" onClick={onClear}>
            <Trash2 />
            Clear value
          </DropdownMenuItem>
        )}
        {onRefresh && (
          <DropdownMenuItem onClick={onRefresh}>
            <RefreshCw />
            Force refresh
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * LockableValueField — a field with a lock toggle, typed as one of several
 * data types, and (for scalar types) switched between a literal value and a
 * JS expression.
 *
 * `locked` is a visual/config indicator only — it does not change the
 * field's interactivity. The value control remains exactly as editable while
 * locked as it is while unlocked; consumers that want locked fields to be
 * non-interactive should omit `onValueChange` (or otherwise gate it) rather
 * than rely on `locked`.
 *
 * The expression mode is styled as code (monospace) but does not carry real
 * syntax highlighting or evaluation. Select/multiselect options default to a
 * small demo set unless `options` is provided. The built-in AI-assist
 * "Generate" button is a no-op unless `onGenerateWithAi` is provided; the
 * Insert-variable menu is empty (and disabled) unless `variables` is
 * provided; file uploads aren't persisted anywhere.
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
  mode = 'fixed',
  onModeChange,
  renderExpressionEditor,
  fieldType = 'string',
  onFieldTypeChange,
  required,
  onRequiredChange,
  label,
  error,
  errorId,
  belowValue,
  fileUploadAriaLabel,
  headerActions,
  compact,
  showFieldActions = true,
  showAiAssist = true,
  options = DEFAULT_SELECT_OPTIONS,
  onGenerateWithAi,
  variables = [],
  id,
  className,
}: LockableValueFieldProps) {
  const generatedId = useId().replace(/:/g, '');
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const fieldId = id ?? generatedId;
  const validationId = errorId ?? `${fieldId}-error`;
  const typeMeta = FIELD_TYPE_META[fieldType];
  const effectiveMode = typeMeta.supportsExpression ? mode : 'fixed';
  const fieldTypeLabel = typeMeta.label.toLowerCase();
  const expressionArticle = /^[aeiou]/.test(fieldTypeLabel) ? 'an' : 'a';
  const fieldLabel =
    effectiveMode === 'expression'
      ? `Write ${expressionArticle} ${fieldTypeLabel} expression`
      : `${typeMeta.label} value`;
  const hasMoreActions = Boolean(more?.onRefresh || more?.onClear);

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
        onFieldTypeChange={onFieldTypeChange}
        onRequiredChange={onRequiredChange}
        compact={compact}
        showFieldActions={showFieldActions}
        showAiAssist={showAiAssist}
        value={value}
        onValueChange={onValueChange}
        variables={variables}
        onGenerateWithAi={onGenerateWithAi}
        headerActions={headerActions}
      />

      {typeMeta.supportsExpression ? (
        <InputGroup
          error={error}
          errorId={validationId}
          className={cn(
            fieldType === 'file' && effectiveMode === 'fixed' && 'h-auto items-stretch'
          )}
        >
          {(showLock || leadingAddon !== undefined) && leadingAddon !== null && (
            <InputGroupAddon align="inline-start">
              {leadingAddon !== undefined
                ? leadingAddon
                : showLock && <LockToggleButton locked={locked} onLockedChange={onLockedChange} />}
            </InputGroupAddon>
          )}

          {effectiveMode === 'expression' ? (
            renderExpressionEditor ? (
              renderExpressionEditor({
                id: fieldId,
                value,
                onValueChange,
                onBlur: onValueBlur,
                readOnly: !onValueChange,
                placeholder: fieldLabel,
                fieldType,
                'aria-invalid': error ? true : undefined,
                'aria-describedby': error ? validationId : undefined,
                'aria-errormessage': error ? validationId : undefined,
                'data-slot': 'input-group-control',
              })
            ) : (
              <InputGroupInput
                id={fieldId}
                readOnly={!onValueChange}
                value={value}
                onChange={(e) => onValueChange?.(e.target.value)}
                onBlur={onValueBlur}
                placeholder={fieldLabel}
                className="font-mono"
              />
            )
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
                    <span className="text-muted-foreground">Pick a date</span>
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
              type={fieldType === 'integer' ? 'number' : 'text'}
              readOnly={!onValueChange}
              value={value}
              onChange={(e) => onValueChange?.(e.target.value)}
              onBlur={onValueBlur}
              placeholder={fieldLabel}
            />
          )}

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
                        aria-label="Choose value type"
                      >
                        {effectiveMode === 'expression' ? <Code2 /> : <Type />}
                      </InputGroupButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <ModeMenuItem
                        icon={Type}
                        label={typeMeta.fixedLabel}
                        description={typeMeta.fixedDescription}
                        active={effectiveMode === 'fixed'}
                        onClick={() => onModeChange?.('fixed')}
                      />
                      <ModeMenuItem
                        icon={Code2}
                        label="Expression"
                        description="Use a JS expression"
                        active={effectiveMode === 'expression'}
                        onClick={() => onModeChange?.('expression')}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {hasMoreActions && more && <MoreActionsMenu more={more} />}
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
                : showLock && <LockToggleButton locked={locked} onLockedChange={onLockedChange} />}
            </InputGroupAddon>
          )}

          {fieldType === 'single-select' ? (
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
                <SelectValue placeholder="Select an option" />
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
              placeholder="Select options..."
              disabled={!onValueChange}
              onBlur={onValueBlur}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? validationId : undefined}
              aria-errormessage={error ? validationId : undefined}
            />
          ) : null}
          {hasMoreActions && more && (
            <InputGroupAddon align="inline-end" className="cursor-default">
              <MoreActionsMenu more={more} />
            </InputGroupAddon>
          )}
        </InputGroup>
      )}

      {belowValue}
    </div>
  );
}
