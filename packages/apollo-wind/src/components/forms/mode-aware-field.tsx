import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, type ControllerRenderProps, useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { FieldMenu, type FieldMenuItem } from '@/components/ui/field-addons/field-menu';
import { ValueModeIndicator } from '@/components/ui/field-addons/value-mode-indicator';
import { ValueModeSwitchDialog } from '@/components/ui/field-addons/value-mode-switch-dialog';
import { FormField, FormFieldDescription, FormFieldHeader } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { PromptValueControl } from '@/components/ui/prompt-value-control';
import { VariableValueControl } from '@/components/ui/variable-value-control';
import {
  DEFAULT_FIELD_ACTION_REGISTRY,
  type FieldActionConfirm,
  type FieldActionContext,
  resolveFieldActions,
  resolveVariables,
  type ValueModeVariable,
} from './field-actions';
import {
  FIELD_CONTROL_GEOMETRY,
  FieldControl,
  type FieldControlFormField,
  type FieldControlGeometry,
} from './field-control';
import type {
  CustomComponents,
  CustomFieldComponentProps,
  FieldMetadata,
  FieldOption,
  FormContext,
  ValueModeId,
  ValueModesConfig,
} from './form-schema';
import { DEFAULT_METADATA_FORM_STRINGS, type MetadataFormStrings } from './form-strings';
import { isEmptyFieldValue } from './validation-converter';
import {
  type CodecContext,
  codecContext,
  convertValue,
  DEFAULT_VALUE_MODE_REGISTRY,
  type FieldControlRegistration,
  isDecodedEmpty,
  isFieldControlRegistration,
  resolveCodec,
  resolveModeOptions,
  type ValueModeCodec,
  type ValueModeControlHandle,
  type ValueModeControlProps,
  type ValueModeControlRegistration,
  type ValueModeRegistry,
} from './value-modes';

export interface ModeAwareFieldProps {
  field: FieldMetadata;
  context: FormContext;
  customComponents: CustomComponents;
  disabled: boolean;
  required: boolean;
  options: FieldOption[];
  /** Further ids for the control's aria-describedby, after the error message's. */
  describedBy?: string;
}

/**
 * Renders a field with `valueModes`, `headerActions`, `menuActions` or `badge` as the field anatomy:
 * header with its actions, then an `InputGroup` holding the mode glyph, the active mode's control
 * and the trailing menu of modes and actions.
 */
export function ModeAwareField(props: ModeAwareFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      name={props.field.name}
      control={control}
      defaultValue={props.field.defaultValue}
      render={({ field: formField, fieldState: { error } }) => (
        <FieldAnatomy {...props} formField={formField} error={error?.message} />
      )}
    />
  );
}

interface FieldAnatomyProps extends ModeAwareFieldProps {
  formField: ControllerRenderProps;
  error?: string;
}

// Their props are a subset of `ValueModeControlProps`, taking the value as a string.
const BUILT_IN_MODE_CONTROLS: Record<string, ValueModeControlRegistration> = {
  variable: { component: VariableValueControl as ValueModeControlRegistration['component'] },
  prompt: {
    component: PromptValueControl as ValueModeControlRegistration['component'],
    layout: 'grow',
    variant: 'agent',
    insertable: true,
  },
};

/** Which step of the control resolution won, shown as `data-value-mode-control` outside production. */
type ControlSource =
  | 'field'
  | 'literal-controls'
  | 'definition'
  | 'custom'
  | 'field-type'
  | 'built-in'
  | 'fallback';

interface Resolved {
  node: React.ReactNode;
  geometry: FieldControlGeometry;
  source: ControlSource;
}

interface PendingWrite extends FieldActionConfirm {
  to: ValueModeId;
  /** The value in `to`. */
  value: unknown;
}

// Field types not yet fitted to a group draw an outline box rather than blend into one.
function unfittedGeometry(field: FieldMetadata): FieldControlGeometry {
  const labelledBy = ['radio', 'slider', 'datetime', 'string-list'].includes(field.type);
  return {
    layout: 'row',
    variant: 'outline',
    labelTarget: labelledBy ? 'labelledby' : 'control',
    insertable: false,
  };
}

function registrationGeometry<P>(registration: FieldControlRegistration<P>): FieldControlGeometry {
  return {
    layout: registration.layout ?? 'row',
    variant: registration.variant ?? 'default',
    labelTarget: registration.labelTarget ?? 'control',
    insertable: registration.insertable ?? false,
  };
}

const TEXT_GEOMETRY: FieldControlGeometry = {
  layout: 'row',
  variant: 'default',
  labelTarget: 'control',
  insertable: true,
};

function FieldAnatomy({
  field,
  context,
  customComponents,
  disabled,
  required,
  options,
  formField,
  error,
  describedBy,
}: FieldAnatomyProps) {
  const form = useFormContext();
  const registry = context.valueModes ?? DEFAULT_VALUE_MODE_REGISTRY;
  const actionRegistry = context.fieldActions ?? DEFAULT_FIELD_ACTION_REGISTRY;
  const strings = context.strings ?? DEFAULT_METADATA_FORM_STRINGS;
  const config = field.valueModes;
  const { name } = field;
  const errorId = `${name}-error`;
  const labelId = `${name}-label`;
  const controlDescribedBy = joinIds(error && errorId, describedBy);
  // Resolved only when a picker opens, so a live variables source never re-renders the field.
  const formVariables = context.variables;
  const variables = useCallback(
    () => resolveVariables(formVariables, field),
    [formVariables, field]
  );

  const { value } = formField;

  const codec = config ? resolveCodec(registry.codecs, config) : undefined;
  const codecCtx = useMemo(() => config && codecContext(field, config), [field, config]);
  const decoded = codec && codecCtx ? codec.decode(value, codecCtx) : undefined;
  const empty =
    codec && codecCtx && decoded
      ? isDecodedEmpty(codec, decoded, codecCtx)
      : isEmptyFieldValue(value);

  // A mode chosen for an empty value may not survive the codec (an empty value can encode to
  // nothing), so it is held here for as long as the stored value is the one it was chosen for.
  const [held, setHeld] = useState<{ mode: ValueModeId; stored: unknown }>();
  const heldMode = held && empty && Object.is(held.stored, value) ? held.mode : undefined;

  const activeMode =
    config && decoded
      ? activeModeOf(config, decoded.mode, empty && isEmptyFieldValue(value), heldMode)
      : 'literal';
  const inner = decoded ? (decoded.mode === activeMode ? decoded.value : undefined) : value;

  const [pending, setPending] = useState<PendingWrite>();

  const groupRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<ValueModeControlHandle | null>(null);

  // What the stable callbacks and the action context read when they run.
  const latest = useRef({
    value,
    inner,
    empty,
    activeMode,
    decoded,
    disabled,
    formField,
    insertable: false,
  });
  latest.current = {
    ...latest.current,
    value,
    inner,
    empty,
    activeMode,
    decoded,
    disabled,
    formField,
  };

  // `previous` lets a codec whose shape holds more than the active mode's value carry the rest over.
  const encode = (mode: ValueModeId, value: unknown) =>
    codec && codecCtx ? codec.encode(mode, value, codecCtx, latest.current.value) : value;

  // `change` is typing, `set` a programmatic write (switch, insert, clear), which validates when a
  // typed change would.
  const write = (next: unknown, via: 'change' | 'set') => {
    if (via === 'change') {
      latest.current.formField.onChange(next);
    } else {
      const liveMode = context.schema.mode === 'onChange' || context.schema.mode === 'all';
      form.setValue(name, next, {
        shouldDirty: true,
        shouldValidate: liveMode || form.formState.isSubmitted,
      });
    }
    return next;
  };

  const commit = (mode: ValueModeId, value: unknown, via: 'change' | 'set') => {
    const stored = write(value, via);
    if (codec && codecCtx) {
      const written = codec.decode(stored, codecCtx);
      setHeld(isDecodedEmpty(codec, written, codecCtx) ? { mode, stored } : undefined);
    }
  };

  const writeInner = (next: unknown, via: 'change' | 'set' = 'change') => {
    const mode = latest.current.activeMode;
    if (config) commit(mode, encode(mode, next), via);
    else write(next, via);
  };
  const setModeValue = (
    mode: ValueModeId,
    value: unknown,
    options?: { confirm?: FieldActionConfirm }
  ) => {
    if (options?.confirm && !latest.current.empty)
      setPending({ ...options.confirm, to: mode, value });
    else commit(mode, encode(mode, value), 'set');
  };

  const handleSelect = (to: ValueModeId) => {
    const current = latest.current;
    if (!codec || !codecCtx || !current.decoded || to === current.activeMode) return;
    const result = convertValue(
      codec,
      { ...current.decoded, mode: current.activeMode },
      to,
      codecCtx
    );
    if (result.kind === 'ok') commit(to, encode(to, result.value), 'set');
    else
      setPending({ to, value: result.value, title: result.title, description: result.description });
  };

  const writeInnerRef = useRef(writeInner);
  writeInnerRef.current = writeInner;
  // Inserts through the text input carrying the field's id: for the built-in controls, and for a
  // registered one that attached no handle. With no such input the reference is appended.
  const domHandle = useMemo<Required<ValueModeControlHandle>>(
    () => ({
      focus: () => controlElement(groupRef.current, name)?.focus(),
      insertText: (text) => {
        const element = controlElement(groupRef.current, name);
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
          // No controlRef handle and no text input to write at the caret: append to the value.
          const current = latest.current.inner;
          writeInnerRef.current(`${typeof current === 'string' ? current : ''}${text}`, 'set');
          return;
        }
        // An email input has no selection, so the reference is appended and the caret left alone.
        const selectable = element.selectionStart !== null;
        const start = element.selectionStart ?? element.value.length;
        const end = element.selectionEnd ?? start;
        writeInnerRef.current(
          element.value.slice(0, start) + text + element.value.slice(end),
          'set'
        );
        const caret = start + text.length;
        // After the written value has rendered, so the caret is not reset by it.
        setTimeout(() => {
          element.focus();
          if (selectable) element.setSelectionRange(caret, caret);
        });
      },
    }),
    [name]
  );

  const ctx = useActionContext({
    field,
    name,
    form,
    modeAware: !!config,
    latest,
    strings,
    variables,
    control: () => {
      const own = controlRef.current;
      if (!own) return domHandle;
      return own.insertText ? own : { ...own, insertText: domHandle.insertText };
    },
    commit,
    write,
    encode,
    setModeValue,
    codec,
    codecCtx,
  });

  const binding: FieldControlFormField = {
    value: controlValue(field, inner),
    onChange: (next) => writeInner(next),
    onBlur: formField.onBlur,
    name: formField.name,
    ref: formField.ref,
  };

  const resolved = resolveControl({
    field,
    config,
    mode: activeMode,
    registry,
    strings,
    customComponents,
    binding,
    controlRef,
    labelId,
    options,
    disabled,
    required,
    error,
    errorId,
    describedBy,
    valueModeProps: () => ({
      value: inner,
      onChange: (next: unknown) => writeInner(next),
      onBlur: formField.onBlur,
      name,
      field,
      disabled,
      required,
      error,
      mode: activeMode,
      onModeValueChange: setModeValue,
      requestModeSwitch: handleSelect,
      controlRef,
      inputRef: formField.ref,
      id: name,
      labelId,
      invalid: !!error,
      placeholder: field.placeholder,
      variables,
      strings: strings.valueModes,
      controlProps: {
        'data-slot': 'input-group-control',
        'aria-invalid': error ? true : undefined,
        'aria-describedby': controlDescribedBy,
        'aria-errormessage': error ? errorId : undefined,
      },
    }),
  });
  latest.current.insertable = resolved.geometry.insertable;

  const { header, menu } = resolveFieldActions(field, actionRegistry);
  const modeOptions = config ? resolveModeOptions(field, config, registry, strings.valueModes) : [];
  const switchable = !!config && (config.switchable ?? config.modes.length > 1);
  const menuItems: FieldMenuItem[] = menu.map((action) => ({
    id: action.id,
    label: typeof action.label === 'function' ? action.label(ctx) : action.label,
    icon: action.icon,
    destructive: action.destructive,
    disabled: action.disabled?.(ctx) ?? false,
    onSelect: () => action.onSelect(ctx),
  }));

  const indicator =
    config && config.indicator !== false && activeMode !== 'literal'
      ? (registry.definitions[activeMode]?.indicator ??
        (activeMode === 'expression' ? (
          <ValueModeIndicator mode="expression" disabled={disabled} strings={strings.valueModes} />
        ) : null))
      : null;

  const headerActions = header.map((action) => (
    <React.Fragment key={action.id}>{action.render(ctx)}</React.Fragment>
  ));

  return (
    <FormField>
      <FormFieldHeader
        label={field.label}
        labelId={labelId}
        htmlFor={resolved.geometry.labelTarget === 'control' ? name : undefined}
        required={required}
        tooltip={field.tooltip}
        tooltipAriaLabel={field.tooltipAriaLabel}
        badge={field.badge ? <Badge variant="secondary">{field.badge}</Badge> : undefined}
        actions={headerActions.length > 0 ? headerActions : undefined}
      />
      <InputGroup
        ref={groupRef}
        layout={resolved.geometry.layout}
        variant={resolved.geometry.variant}
        disabled={disabled}
        error={error}
        errorId={errorId}
        data-value-mode-control={
          process.env.NODE_ENV === 'production' ? undefined : resolved.source
        }
      >
        {indicator && <InputGroupAddon align="inline-start">{indicator}</InputGroupAddon>}
        {resolved.node}
        {(switchable || menuItems.length > 0) && (
          <InputGroupAddon align="inline-end">
            <FieldMenu<string>
              mode={activeMode}
              onSelect={handleSelect}
              modes={modeOptions}
              actions={menuItems}
              modesDisabled={!switchable}
              disabled={disabled}
              strings={strings.valueModes}
            />
          </InputGroupAddon>
        )}
      </InputGroup>
      <FormFieldDescription>{field.description}</FormFieldDescription>
      <ValueModeSwitchDialog
        open={!!pending}
        title={pending?.title}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        strings={strings.valueModes}
        onCancel={() => setPending(undefined)}
        onConfirm={() => {
          // The field may have been disabled while the dialog was open.
          if (pending && !latest.current.disabled) {
            commit(pending.to, encode(pending.to, pending.value), 'set');
          }
          setPending(undefined);
        }}
      />
    </FormField>
  );
}

/**
 * The value a control is given: an empty one in its field type's empty shape, so a control that was
 * showing a value clears rather than turning uncontrolled and keeping it.
 */
function controlValue(field: FieldMetadata, value: unknown): unknown {
  if (value !== null && value !== undefined) return value;
  switch (field.type) {
    case 'text':
    case 'email':
    case 'textarea':
    case 'number':
    case 'select':
    case 'radio':
      return '';
    case 'multiselect':
    case 'string-list':
      return [];
    default:
      return undefined;
  }
}

/**
 * The mode a decoded value is shown in. `unset` is a stored value that is empty before decoding,
 * so it names no mode; an emptied one the codec wrapped keeps the mode it was cleared in.
 */
function activeModeOf(
  config: ValueModesConfig,
  decodedMode: ValueModeId,
  unset: boolean,
  heldMode: ValueModeId | undefined
): ValueModeId {
  if (heldMode) return heldMode;
  if (unset) return config.defaultMode ?? config.modes[0] ?? 'literal';
  return decodedMode;
}

function controlElement(group: HTMLElement | null, id: string): HTMLElement | null {
  if (!group) return null;
  for (const element of group.querySelectorAll<HTMLElement>('[id]')) {
    if (element.id === id) return element;
  }
  return null;
}

interface ActionContextInput {
  field: FieldMetadata;
  name: string;
  form: FieldActionContext['form'];
  modeAware: boolean;
  latest: React.MutableRefObject<{
    value: unknown;
    empty: boolean;
    activeMode: ValueModeId;
    decoded: ReturnType<ValueModeCodec['decode']> | undefined;
    disabled: boolean;
    formField: ControllerRenderProps;
    insertable: boolean;
  }>;
  strings: MetadataFormStrings;
  variables: () => ValueModeVariable[];
  control: () => ValueModeControlHandle | null;
  commit: (mode: ValueModeId, stored: unknown, via: 'change' | 'set') => void;
  write: (stored: unknown, via: 'change' | 'set') => unknown;
  encode: (mode: ValueModeId, value: unknown) => unknown;
  setModeValue: (
    mode: ValueModeId,
    value: unknown,
    options?: { confirm?: FieldActionConfirm }
  ) => void;
  codec: ValueModeCodec | undefined;
  codecCtx: CodecContext | undefined;
}

/**
 * The context handed to actions: one object per field whose members read the field's state when
 * accessed, so an action that resolves later (AI assist) sees the value and mode of that moment.
 */
function useActionContext(input: ActionContextInput): FieldActionContext {
  const inputRef = useRef(input);
  inputRef.current = input;
  const { field, name, form, modeAware } = input;

  return useMemo(() => {
    const current = () => inputRef.current;
    const setStored = (stored: unknown) => {
      const { codec, codecCtx, commit, write } = current();
      if (codec && codecCtx) commit(codec.decode(stored, codecCtx).mode, stored, 'set');
      else write(stored, 'set');
    };
    const ctx: FieldActionContext = {
      field,
      name,
      form,
      get value() {
        return current().latest.current.value;
      },
      setValue: setStored,
      clear: () => {
        const { latest, encode, commit, write } = current();
        const mode = latest.current.activeMode;
        // The mode is committed rather than decoded back: a codec may store an empty value without it.
        // `null`, not `undefined`: react-hook-form reads `undefined` as unset and shows the default.
        if (modeAware) commit(mode, encode(mode, null), 'set');
        else write(null, 'set');
      },
      get empty() {
        return current().latest.current.empty;
      },
      get disabled() {
        return current().latest.current.disabled;
      },
      get strings() {
        return current().strings;
      },
      get control() {
        return current().control();
      },
      get insertable() {
        return current().latest.current.insertable;
      },
      variables: () => current().variables(),
    };
    if (modeAware) {
      Object.defineProperty(ctx, 'mode', {
        enumerable: true,
        get: () => {
          const { decoded, activeMode } = current().latest.current;
          return decoded && { ...decoded, mode: activeMode };
        },
      });
      ctx.setModeValue = (mode, value, options) => current().setModeValue(mode, value, options);
    }
    return ctx;
  }, [field, name, form, modeAware]);
}

interface ResolveControlInput {
  field: FieldMetadata;
  config: ValueModesConfig | undefined;
  mode: ValueModeId;
  registry: ValueModeRegistry;
  strings: MetadataFormStrings;
  customComponents: CustomComponents;
  binding: FieldControlFormField;
  controlRef: React.Ref<ValueModeControlHandle>;
  labelId: string;
  options: FieldOption[];
  disabled: boolean;
  required: boolean;
  error: string | undefined;
  errorId: string;
  /** Further ids for the control's aria-describedby, after the error message's. */
  describedBy: string | undefined;
  valueModeProps: () => ValueModeControlProps;
}

/**
 * The value control for the active mode: the field's own by name, then for `literal` the plugin's
 * per-field-type one, then the mode definition's, then the built-in; an unknown mode gets an Input.
 */
function resolveControl(input: ResolveControlInput): Resolved {
  const { field, config, mode, registry } = input;
  const named = config?.controls?.[mode];
  let registration: ValueModeControlRegistration | undefined;
  let source: ControlSource | undefined;
  let componentProps: Record<string, unknown> | undefined;
  if (named) {
    const controlName = typeof named === 'string' ? named : named.component;
    registration = registry.controlRegistry[controlName];
    source = 'field';
    componentProps = typeof named === 'string' ? undefined : named.componentProps;
  }
  if (!registration && mode === 'literal' && registry.literalControls[field.type]) {
    registration = registry.literalControls[field.type];
    source = 'literal-controls';
  }
  if (!registration && registry.definitions[mode]?.control) {
    registration = registry.definitions[mode]?.control;
    source = 'definition';
  }

  if (registration && source) {
    const Control = registration.component;
    // `componentProps` go first so they cannot replace the value, its writers or the mode.
    return {
      node: <Control {...componentProps} {...input.valueModeProps()} />,
      geometry: registrationGeometry(registration),
      source,
    };
  }

  if (mode === 'literal') return builtInLiteral(input);
  const builtIn = BUILT_IN_MODE_CONTROLS[mode];
  if (builtIn) {
    const Control = builtIn.component;
    return {
      node: <Control {...input.valueModeProps()} />,
      geometry: registrationGeometry(builtIn),
      source: 'built-in',
    };
  }
  if (mode === 'expression') {
    return { node: <FallbackControl {...input} />, geometry: TEXT_GEOMETRY, source: 'built-in' };
  }
  return {
    node: <FallbackControl {...input} />,
    geometry: TEXT_GEOMETRY,
    source: 'fallback',
  };
}

/** The built-in control of a mode with none of its own: a plain Input over a string value. */
function FallbackControl({
  field,
  binding,
  disabled,
  error,
  errorId,
  describedBy,
}: ResolveControlInput) {
  const { value } = binding;
  return (
    <Input
      id={field.name}
      name={binding.name}
      ref={binding.ref as React.Ref<HTMLInputElement>}
      value={typeof value === 'string' ? value : value == null ? '' : String(value)}
      onChange={(event) => binding.onChange(event.target.value)}
      onBlur={binding.onBlur}
      placeholder={field.placeholder}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={joinIds(error && errorId, describedBy)}
      aria-errormessage={error ? errorId : undefined}
    />
  );
}

/** Space-joins the ids that are set, or `undefined` when none is. */
function joinIds(...ids: (string | false | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

function builtInLiteral(input: ResolveControlInput): Resolved {
  const { field, binding, options, disabled, required, error, strings, customComponents } = input;

  if (field.type === 'custom') {
    const entry = customComponents[field.component];
    if (!entry) {
      return {
        node: <FallbackControl {...input} />,
        geometry: TEXT_GEOMETRY,
        source: 'fallback',
      };
    }
    const registration: FieldControlRegistration<CustomFieldComponentProps> =
      isFieldControlRegistration(entry) ? entry : { component: entry };
    const Component = registration.component;
    const { ref: _ref, ...bindingProps } = binding;
    return {
      node: (
        <Component
          {...bindingProps}
          {...field.componentProps}
          field={field}
          disabled={disabled}
          required={required}
          error={error}
          controlRef={input.controlRef}
          labelId={input.labelId}
          aria-describedby={joinIds(
            field.componentProps?.['aria-describedby'] as string | undefined,
            input.describedBy
          )}
        />
      ),
      geometry: registrationGeometry(registration),
      source: 'custom',
    };
  }

  return {
    node: (
      <FieldControl
        field={field}
        formField={binding}
        options={options}
        disabled={disabled}
        invalid={!!error}
        strings={strings.boolean}
        describedBy={input.describedBy}
      />
    ),
    geometry: FIELD_CONTROL_GEOMETRY[field.type] ?? unfittedGeometry(field),
    source: 'field-type',
  };
}
