import * as React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  builtInValueModes,
  FieldMenu,
  ValueModeIndicator,
  type ValueModeOption,
} from '@/components/ui/field-addons';
import {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
} from '@/components/ui/form-field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { MultiSelect } from '@/components/ui/multi-select';
import { RowDeleteButton } from '@/components/ui/row-groups';
import { afterPress } from '@/components/ui/row-groups/after-press';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VariableValueControl } from '@/components/ui/variable-value-control';
import { cn } from '@/lib';
import { type ConditionPatch, useConditionsEditor } from './context';
import type { Condition, ConditionValueMode } from './model';
import {
  allowedModes,
  conditionError,
  formatDateValue,
  isComplete,
  isValueInvalid,
  operatorsFor,
  parseDateValue,
  type ResolvedCondition,
  resolveCondition,
} from './status';
import type { ConditionField } from './vocabulary';

// The row lays itself out by its own width: each part on its own line, then field and operator side
// by side with the value below, then all three on one line.
const ROW_GRID =
  'grid min-w-0 flex-1 grid-cols-1 items-start gap-2 @xs:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]';
// On one line, only a group's first row shows its labels, which then head the columns. Later rows
// keep theirs for assistive technology, so every control is named by its own row.
const LABEL_CLASS = '@lg:in-[[data-condition-row]~[data-condition-row]]:sr-only';
// Stands in for a label above delete, so it lines up with the controls rather than the labels.
const LABEL_SPACER_CLASS = 'h-4 @lg:in-[[data-condition-row]~[data-condition-row]]:hidden';

const POPUPS = '[data-radix-popper-content-wrapper], [role="dialog"]';

/**
 * Blur that leaves the row. Focus moving into a popup the row opened, such as its select's list,
 * does not count; a popup the whole editor sits in, such as a side panel, does not shelter it.
 */
function leftRow(event: React.FocusEvent<HTMLElement>) {
  const next = event.relatedTarget as HTMLElement | null;
  if (next && event.currentTarget.contains(next)) return false;
  const popup = next?.closest(POPUPS);
  if (popup && !popup.contains(event.currentTarget)) return false;
  return true;
}

/**
 * The values a field can keep from another field of the same type: for options, the ones it has.
 * An expression or variable is a reference, not an option, so it stays.
 */
function keptValues(
  c: Condition,
  field: ConditionField | undefined,
  mode: ConditionValueMode
): ConditionPatch {
  if (field?.type !== 'enum' || mode !== 'literal') return {};
  const known = (value: string) => field.options?.some((option) => option.value === value);
  return {
    value: c.value && known(c.value) ? c.value : '',
    values: (c.values ?? []).filter(known),
  };
}

/**
 * The value box: the control for the field's type and mode, the = glyph in Expression, and the mode
 * menu in a trailing addon. Choosing a variable is the Variable mode, not an action in the box.
 */
function ConditionValue({
  condition: c,
  resolved,
  name,
  labelledBy,
  invalid,
  errorId,
  describedBy,
  onChange,
}: {
  condition: Condition;
  resolved: ResolvedCondition;
  /** Spoken name, e.g. "Condition 2 Value". */
  name: string;
  labelledBy: string;
  invalid: boolean;
  errorId?: string;
  describedBy?: string;
  onChange: (patch: ConditionPatch) => void;
}) {
  const editor = useConditionsEditor();
  const { strings, disabled } = editor;
  const controlId = React.useId();
  const { field, operator, mode } = resolved;
  const aria = {
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
    'aria-errormessage': invalid ? errorId : undefined,
  } as const;

  const builtIns = builtInValueModes(editor.valueModeStrings, {
    expectedType: field?.type === 'number' ? 'number' : undefined,
  });
  // A mode the operator rules out stays listed, disabled, so it is not mistaken for missing.
  const modes = editor.valueModes.map(
    (id): ValueModeOption<ConditionValueMode> =>
      resolved.allowedModes.includes(id)
        ? { ...builtIns[id], id }
        : {
            ...builtIns[id],
            id,
            disabled: true,
            description: strings.valueModeUnavailable(operator?.label ?? ''),
          }
  );

  const builtInControl = () => {
    if (mode === 'variable') {
      return (
        <VariableValueControl
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          value={c.value}
          variables={editor.variables ?? []}
          disabled={disabled}
          strings={editor.valueModeStrings}
          onChange={(reference) => onChange({ value: reference })}
        />
      );
    }
    if (mode === 'literal' && field?.type === 'date') {
      return (
        <DatePicker
          aria-labelledby={labelledBy}
          {...aria}
          placeholder={strings.datePlaceholder}
          value={parseDateValue(c.value)}
          disabled={disabled}
          onValueChange={(date) => onChange({ value: date ? formatDateValue(date) : '' })}
        />
      );
    }
    if (mode === 'literal' && field?.type === 'enum' && operator?.multiple) {
      return (
        <>
          {/* MultiSelect is named through its id only. This carries the visible label's words
              plus the row, for assistive technology. */}
          <label htmlFor={controlId} className="sr-only">
            {name}
          </label>
          <MultiSelect
            id={controlId}
            {...aria}
            options={[...(field.options ?? [])]}
            selected={c.values ?? []}
            overflow="collapse"
            placeholder={strings.optionsPlaceholder}
            disabled={disabled}
            strings={editor.multiSelectStrings}
            onChange={(values) => onChange({ values })}
          />
        </>
      );
    }
    if (mode === 'literal' && field?.type === 'enum') {
      return (
        <Select value={c.value} onValueChange={(value) => onChange({ value })} disabled={disabled}>
          <SelectTrigger aria-labelledby={labelledBy} {...aria}>
            <SelectValue placeholder={strings.optionPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <InputGroupInput
        aria-labelledby={labelledBy}
        {...aria}
        className={cn(mode === 'expression' && 'font-mono')}
        placeholder={
          mode === 'expression'
            ? strings.expressionPlaceholder || undefined
            : strings.valuePlaceholder
        }
        value={c.value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange({ value: event.target.value })}
      />
    );
  };

  const hostControl = editor.renderValue?.({
    condition: c,
    field,
    operator,
    mode,
    labelledBy,
    invalid,
    errorId,
    describedBy,
    disabled,
    onChange,
  });

  return (
    // `invalid` marks the grouped control through the group, which is the only way to reach
    // VariableValueControl's trigger: it does not take aria-invalid itself.
    <InputGroup invalid={invalid}>
      {mode === 'expression' && (
        <InputGroupAddon align="inline-start">
          <ValueModeIndicator
            mode="expression"
            className="px-0"
            strings={editor.valueModeStrings}
          />
        </InputGroupAddon>
      )}
      {hostControl === undefined ? builtInControl() : hostControl}
      {modes.length > 1 && (
        <InputGroupAddon align="inline-end">
          <FieldMenu<ConditionValueMode>
            mode={mode}
            modes={modes}
            disabled={disabled}
            strings={editor.valueModeStrings}
            triggerLabel={strings.valueModeMenu(name, builtIns[mode].title)}
            // Reselecting the current mode keeps the value; only a real switch clears it.
            onSelect={(next) => {
              if (next !== mode) onChange({ valueMode: next, value: '', values: [] });
            }}
          />
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

/**
 * Between two adjacent rows of a group, where the rows stack. It sits in the list's flow and spans
 * the rows' full width. The next row's label line box has about 4px of leading above its glyphs, so
 * the gap below is pulled in to match the gap above, unless the row above also ends in text.
 */
export function ConditionSeparator() {
  return (
    <div aria-hidden="true" data-condition-separator="" className="@lg:hidden">
      <div className="h-px bg-border" />
    </div>
  );
}

export interface ConditionRowProps {
  /** 1-based position across the editor, used in accessible names. */
  index: number;
  /** 0-based position in its group, for focus after a delete. */
  position: number;
  condition: Condition;
  onDelete: (id: string, position: number) => void;
}

/**
 * Field / operator / value / delete. The operators and the value control follow the field's type,
 * and operators like "Is empty" hide the value. The operator decides the value mode: picking one
 * that cannot compare against the current mode resets the value to the first mode it allows. Every
 * change also writes the operator and mode the row shows, so the host's model matches the screen.
 */
export const ConditionRow = React.memo(function ConditionRow({
  index,
  position,
  condition: c,
  onDelete,
}: ConditionRowProps) {
  const editor = useConditionsEditor();
  const { strings, disabled } = editor;
  const baseId = React.useId();
  const errorId = `${baseId}-error`;
  const rowNameId = `${baseId}-name`;
  const labelIds = {
    field: `${baseId}-field`,
    operator: `${baseId}-operator`,
    value: `${baseId}-value`,
  };
  const labelledBy = (part: 'field' | 'operator' | 'value') => `${rowNameId} ${labelIds[part]}`;

  const resolved = resolveCondition(c, editor);
  const showError = editor.forceErrors || editor.touched.has(c.id);
  const error = showError ? conditionError(c, editor, strings) : undefined;
  const invalid = Boolean(error);
  const warningId = `${baseId}-warning`;
  const hintId = `${baseId}-hint`;
  // Only a finished row is warned about, so the warning never hides what is missing.
  const warning =
    showError && !error && resolved.hasValue && isComplete(c, editor)
      ? editor.valueWarning?.(c)
      : undefined;
  // How to write the value, such as which pattern syntax, while the row takes one.
  const hint = resolved.hasValue ? resolved.operator?.valueHint : undefined;
  const rowName = strings.conditionName(index);

  const onChange = (patch: ConditionPatch) => {
    // A row without an operator or with a mode the editor lacks shows a default; save what it shows.
    const shown: ConditionPatch = {};
    if (c.operator === undefined && resolved.operator) shown.operator = resolved.operator.value;
    if (c.valueMode !== undefined && c.valueMode !== resolved.mode) shown.valueMode = resolved.mode;
    editor.updateCondition(c.id, { ...shown, ...patch });
  };

  /** Keeps the row's value mode one the operator allows, clearing a value the switch strands. */
  const withOperator = (
    patch: ConditionPatch,
    field: ConditionField | undefined,
    operatorValue: string | undefined
  ): ConditionPatch => {
    const operators = operatorsFor(field, editor.operators);
    const next = operators.find((option) => option.value === operatorValue) ?? operators[0];
    const modes = allowedModes(next, editor.valueModes);
    const base = { ...patch, operator: next?.value };
    if (!modes.includes(resolved.mode)) {
      return { ...base, valueMode: modes[0] ?? 'literal', value: '', values: [] };
    }
    if (Boolean(next?.multiple) !== Boolean(resolved.operator?.multiple)) {
      return { ...base, value: '', values: [] };
    }
    return base;
  };

  const fieldControl = (
    <Select
      value={c.field}
      disabled={disabled}
      onValueChange={(value) => {
        const field = editor.fields.find((option) => option.value === value);
        // An empty row already offers text operators, so a text field keeps what was typed.
        const sameType = (field?.type ?? 'string') === (resolved.field?.type ?? 'string');
        if (sameType) {
          onChange({
            ...withOperator({ field: value }, field, resolved.operator?.value),
            ...keptValues(c, field, resolved.mode),
          });
          return;
        }
        onChange({
          ...withOperator({ field: value }, field, undefined),
          value: '',
          values: [],
        });
      }}
    >
      <SelectTrigger
        data-row-first=""
        aria-labelledby={labelledBy('field')}
        aria-invalid={(invalid && !resolved.field) || undefined}
        aria-describedby={invalid ? errorId : undefined}
        aria-errormessage={invalid && !resolved.field ? errorId : undefined}
      >
        <SelectValue placeholder={strings.fieldPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {/* A field the form no longer has still shows what the row compares, so it can be fixed. */}
        {c.field && !resolved.field && (
          <SelectItem value={c.field} disabled>
            {strings.unknownField(c.field)}
          </SelectItem>
        )}
        {editor.fields.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const operatorInvalid = invalid && Boolean(resolved.field) && !resolved.operator;
  const operatorControl = (
    <Select
      // An unknown operator shows as unchosen, not as another operator.
      value={resolved.operator?.value ?? ''}
      disabled={disabled}
      onValueChange={(operator) => onChange(withOperator({}, resolved.field, operator))}
    >
      <SelectTrigger
        aria-labelledby={labelledBy('operator')}
        aria-invalid={operatorInvalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        aria-errormessage={operatorInvalid ? errorId : undefined}
      >
        <SelectValue placeholder={strings.operatorPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {resolved.operators.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const valueControl = resolved.hasValue ? (
    <ConditionValue
      condition={c}
      resolved={resolved}
      name={`${rowName} ${strings.valueLabel}`}
      labelledBy={labelledBy('value')}
      // Marked whenever the value is missing or wrong, even before a field is chosen, so every
      // control the message asks for carries aria-invalid.
      invalid={invalid && isValueInvalid(c, resolved)}
      // A warning describes the value without marking it invalid.
      errorId={invalid ? errorId : warning ? warningId : undefined}
      describedBy={
        [hint && hintId, invalid ? errorId : warning && warningId].filter(Boolean).join(' ') ||
        undefined
      }
      onChange={onChange}
    />
  ) : null;

  const deleteControl = (
    <RowDeleteButton
      label={strings.removeCondition(index)}
      onClick={() => onDelete(c.id, position)}
      disabled={disabled}
    />
  );

  // Once field and operator are chosen, a message can only be about the value, so it sits under the
  // value. Until then it is about the row, and sits under all of it.
  const valueMessage = Boolean(valueControl && resolved.field && resolved.operator);
  const errorMessage = error && <FormFieldError id={errorId}>{error}</FormFieldError>;

  return (
    <fieldset
      data-row=""
      data-condition-row=""
      aria-label={rowName}
      className="m-0 flex min-w-0 flex-col border-0 p-0"
      onBlur={(event) => {
        // Its message waits for a click in progress, which the message would push out of reach.
        if (!editor.touched.has(c.id) && leftRow(event)) afterPress(() => editor.markTouched(c.id));
      }}
    >
      {/* The row half of each control's name; the visible label supplies the rest. */}
      <span id={rowNameId} className="sr-only">
        {rowName}
      </span>
      {/* A FormField, so a row message sits below the controls as it does below a field's. */}
      <FormField>
        <div className="@container">
          <div className="flex items-start gap-2">
            <div className={ROW_GRID}>
              <FormField>
                <FormFieldLabel id={labelIds.field} className={LABEL_CLASS}>
                  {strings.fieldLabel}
                </FormFieldLabel>
                {fieldControl}
              </FormField>
              <FormField>
                <FormFieldLabel id={labelIds.operator} className={LABEL_CLASS}>
                  {strings.operatorLabel}
                </FormFieldLabel>
                {operatorControl}
              </FormField>
              {valueControl && (
                <FormField className="@xs:col-span-2 @lg:col-span-1">
                  <FormFieldLabel id={labelIds.value} className={LABEL_CLASS}>
                    {strings.valueLabel}
                  </FormFieldLabel>
                  {valueControl}
                  {hint && <FormFieldDescription id={hintId}>{hint}</FormFieldDescription>}
                  {valueMessage && errorMessage}
                  {warning && (
                    <FormFieldError id={warningId} severity="warning">
                      {warning}
                    </FormFieldError>
                  )}
                </FormField>
              )}
            </div>
            <FormField>
              <span aria-hidden="true" className={LABEL_SPACER_CLASS} />
              <div className="flex h-9 items-center future:h-10">{deleteControl}</div>
            </FormField>
          </div>
        </div>
        {!valueMessage && errorMessage}
      </FormField>
    </fieldset>
  );
});
