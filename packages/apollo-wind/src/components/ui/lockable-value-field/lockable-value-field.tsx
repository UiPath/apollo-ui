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
  getLockedDisplayValue,
  parseDateValue,
  parseListValue,
  toDateOnlyString,
} from './utils';

function MoreActionsMenu({
  more,
  locked,
}: {
  more: LockableValueFieldMoreActions;
  locked: boolean;
}) {
  const onDelete = more.onDelete;
  const onClear = locked ? undefined : more.onClear;
  const onRefresh = more.onRefresh;

  if (!onDelete && !onClear && !onRefresh && !more.children) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton icon size="3xs" aria-label="More value actions">
          <MoreHorizontal />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {more.children}
        {onDelete && (
          <DropdownMenuItem className="text-error focus:text-error" onClick={onDelete}>
            <Trash2 />
            Delete field
          </DropdownMenuItem>
        )}
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
 * LockableValueField — a field that can be locked to read-only, typed as one
 * of several data types, and (for scalar types) switched between a literal
 * value and a JS expression.
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
  leadingAddonClassName,
  trailingAddon,
  showValueTypeAction = true,
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
  const editableOnValueChange = locked ? undefined : onValueChange;
  const fieldTypeLabel = typeMeta.label.toLowerCase();
  const expressionArticle = /^[aeiou]/.test(fieldTypeLabel) ? 'an' : 'a';
  const fieldLabel =
    effectiveMode === 'expression'
      ? `Write ${expressionArticle} ${fieldTypeLabel} expression`
      : `${typeMeta.label} value`;
  const hasMoreActions = Boolean(
    more?.children || more?.onDelete || more?.onRefresh || (!locked && more?.onClear)
  );

  // Locked fields are read-only, not disabled — the raw control (switch, date
  // picker, select) has nothing left to do once editing is blocked, so it's
  // replaced with plain, selectable text showing the same value.
  const lockedDisplayValue = getLockedDisplayValue(fieldType, value, options);

  return (
    <div className={cn('@container group flex flex-col gap-1.5', className)}>
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
        onValueChange={editableOnValueChange}
        variables={variables}
        onGenerateWithAi={onGenerateWithAi}
        headerActions={headerActions}
      />

      {typeMeta.supportsExpression ? (
        <InputGroup
          error={error}
          errorId={validationId}
          className={cn(
            fieldType === 'file' && !locked && effectiveMode === 'fixed' && 'h-auto items-stretch'
          )}
        >
          {(showLock || leadingAddon !== undefined) && leadingAddon !== null && (
            <InputGroupAddon align="inline-start" className={leadingAddonClassName}>
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
                onValueChange: editableOnValueChange,
                onBlur: onValueBlur,
                readOnly: !editableOnValueChange,
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
                readOnly={!editableOnValueChange}
                value={value}
                onChange={(e) => editableOnValueChange?.(e.target.value)}
                onBlur={onValueBlur}
                placeholder={fieldLabel}
                className="font-mono"
              />
            )
          ) : locked ? (
            <InputGroupInput
              id={fieldId}
              readOnly
              value={lockedDisplayValue}
              placeholder={fieldLabel}
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
                  {showValueTypeAction && (
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
                  )}
                  {hasMoreActions && more && <MoreActionsMenu more={more} locked={locked} />}
                </>
              )}
            </InputGroupAddon>
          )}
        </InputGroup>
      ) : (
        <InputGroup error={error} errorId={validationId}>
          {(showLock || leadingAddon !== undefined) && leadingAddon !== null && (
            <InputGroupAddon align="inline-start" className={leadingAddonClassName}>
              {leadingAddon !== undefined
                ? leadingAddon
                : showLock && <LockToggleButton locked={locked} onLockedChange={onLockedChange} />}
            </InputGroupAddon>
          )}

          {locked ? (
            <InputGroupInput
              id={fieldId}
              readOnly
              value={lockedDisplayValue}
              placeholder={fieldLabel}
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
              <MoreActionsMenu more={more} locked={locked} />
            </InputGroupAddon>
          )}
        </InputGroup>
      )}

      {belowValue}
    </div>
  );
}
